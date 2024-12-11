import { expect } from "chai";
import { GameRewardDistributor, MockERC20 } from "../typechain-types";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "ethers";
import { deployments, ethers, getNamedAccounts } from "hardhat"
import { time } from "@nomicfoundation/hardhat-network-helpers"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

describe("GameRewardDistributor", function () {

    const setupFixture = deployments.createFixture(async () => {
		await deployments.fixture()
		const signers = await getNamedAccounts()
		//const owner = signers.deployer

		const gameRewardDistributor = await ethers.deployContract(
			"GameRewardDistributor",
			[],
			await ethers.getSigner(signers.deployer)
		)

        let tokenName = "Play2Help";
        let symbol = "P2H";
        let decimals = 18;
        let amountToMint = ethers.parseEther("100000000")
        const mockERC20 = await ethers.deployContract(
			"MockERC20",
			[tokenName, symbol, decimals],
			await ethers.getSigner(signers.deployer)
		)

		const gameRewardDistributorAddress = await gameRewardDistributor.getAddress()
        const accounts = await ethers.getSigners();

		await mockERC20.connect(accounts[0]).mint(gameRewardDistributorAddress, amountToMint);

        let mockERC20Address = await mockERC20.getAddress()
        const tokenAmount1 = ethers.parseUnits("100", 18); // 100 tokens
        const tokenAmount2 = ethers.parseUnits("200", 18); // 200 tokens
        let merkleTree: MerkleTree, merkleRoot: string;

        const claims = [
            {
              address: accounts[1].address,
              token: mockERC20Address,
              amount: tokenAmount1,
            },
            {
              address: accounts[2].address,
              token: mockERC20Address,
              amount: tokenAmount2,
            },
          ];

          const leaves = claims.map((claim) =>
                keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "address", "uint256"],
                    [claim.address, claim.token, claim.amount]
                    )
                )
          );

          merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
          merkleRoot = merkleTree.getHexRoot();

          console.log("merkle tree ", merkleTree.toString())
          console.log("merkle root ", merkleRoot)

		return {
			gameRewardDistributor,
			gameRewardDistributorAddress: await gameRewardDistributor.getAddress(),
			deployer: signers.deployer,
			accounts: await ethers.getSigners(),
			mockERC20,
            mockERC20Address: await mockERC20.getAddress(),
            claims,
            merkleRoot,
            merkleTree

		}
	})


  it("should initialize with an empty Merkle root", async () => {
    const { gameRewardDistributor } = await setupFixture()
    const initialRoot = await gameRewardDistributor.merkleRoot();
    expect(initialRoot).to.equal(keccak256(new TextEncoder().encode("")));
  });

  it("should update the Merkle root", async () => {
    const { accounts, gameRewardDistributor } = await setupFixture()
    const newRoot = ethers.keccak256(ethers.toUtf8Bytes("NewRoot"));
    await gameRewardDistributor.connect(accounts[0]).updateMerkleRoot(newRoot);
    const updatedRoot = await gameRewardDistributor.connect(accounts[0]).merkleRoot();
    expect(updatedRoot).to.equal(newRoot);
  });

  it("should allow a user to claim tokens with a valid Merkle proof", async () => {
    const { accounts, gameRewardDistributor, mockERC20Address, merkleTree, mockERC20, merkleRoot } = await setupFixture();
    await gameRewardDistributor.connect(accounts[0]).updateMerkleRoot(merkleRoot);
    const storedRoot = await gameRewardDistributor.merkleRoot();
    expect(storedRoot).to.equal(merkleRoot);
    console.log("stored root , ", storedRoot)
    const tokenAmount1 = ethers.parseUnits("100", 18);

    const leaf = keccak256(
              ethers.AbiCoder.defaultAbiCoder().encode(["address", "address", "uint256"], [
                accounts[1].address,
                mockERC20Address,
                tokenAmount1,
              ])
          );

    
    const proof = merkleTree.getHexProof(leaf);
    await gameRewardDistributor.connect(accounts[1]).claimTokens(mockERC20Address, tokenAmount1, proof)
    const balance = await mockERC20.balanceOf(accounts[1].address);
    expect(balance).to.equal(tokenAmount1);
  });

  it("should prevent claims with an invalid Merkle proof", async () => {
    const { accounts, gameRewardDistributor, mockERC20Address, merkleRoot } = await setupFixture();
    await gameRewardDistributor.connect(accounts[0]).updateMerkleRoot(merkleRoot);
    const invalidProof: string[] = [];
    const tokenAmount1 = ethers.parseUnits("100", 18);
    await expect(
      gameRewardDistributor.connect(accounts[1]).claimTokens(mockERC20Address, tokenAmount1, invalidProof)
    ).to.be.revertedWithCustomError(gameRewardDistributor, "InvalidMerkelProofError");
  });

  it("should prevent double claims", async () => {
    const { accounts, gameRewardDistributor, mockERC20Address, merkleTree, merkleRoot } = await setupFixture();
    await gameRewardDistributor.connect(accounts[0]).updateMerkleRoot(merkleRoot);
    const tokenAmount1 = ethers.parseUnits("100", 18);
    const leaf = keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(["address", "address", "uint256"], [
        accounts[1].address,
        mockERC20Address,
        tokenAmount1,
      ])
    );
    const proof = merkleTree.getHexProof(leaf);

    // User1 claims tokens
    await gameRewardDistributor.connect(accounts[1]).claimTokens(mockERC20Address, tokenAmount1, proof);
    // Attempt double claim
    await expect(
        gameRewardDistributor.connect(accounts[1]).claimTokens(mockERC20Address, tokenAmount1, proof)
    ).to.be.revertedWithCustomError(gameRewardDistributor, "NoAmountLeftToClaimError");
  });

  it("should prevent unauthorized users from updating the Merkle root", async () => {
    const { accounts, gameRewardDistributor } = await setupFixture();
    await expect(
      gameRewardDistributor.connect(accounts[3]).updateMerkleRoot(keccak256(ethers.hexlify(ethers.toUtf8Bytes("NewRoot"))))
    ).to.be.reverted;
  });
});