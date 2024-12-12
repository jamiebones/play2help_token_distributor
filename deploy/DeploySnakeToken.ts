import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer, owner } = await hre.getNamedAccounts()

	await hre.deployments.deploy("SnakeToken", {
		from: deployer,
        args: ["0x7762A721C6B341732920a4b09ebf4a6bd2f8985C"],
		log: true,
	})
}

export default func

func.tags = ["SnakeToken"]