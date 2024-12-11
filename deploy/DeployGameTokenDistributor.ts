import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer, owner } = await hre.getNamedAccounts()

	await hre.deployments.deploy("GameRewardDistributor", {
		from: deployer,
		log: true,
	})
}

export default func

func.tags = ["distributor"]

//contract address at BSCTestnet: 0x7762A721C6B341732920a4b09ebf4a6bd2f8985C
//Distrbutor address: https://testnet.bscscan.com/address/0x7762A721C6B341732920a4b09ebf4a6bd2f8985C#code