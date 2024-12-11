import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer, owner } = await hre.getNamedAccounts()

	await hre.deployments.deploy("Play2Help", {
		from: deployer,
        args: ["0x7762A721C6B341732920a4b09ebf4a6bd2f8985C"],
		log: true,
	})
}

export default func

func.tags = ["play2Help"]

//Distributor contract at BSCTestnet: 0x7762A721C6B341732920a4b09ebf4a6bd2f8985C
//Play2Help address => 0xBaAaBaD74EbB522Bb6f626B8cbBac4B6737C410a
//Play2Help address => https://testnet.bscscan.com/address/0xBaAaBaD74EbB522Bb6f626B8cbBac4B6737C410a#code
