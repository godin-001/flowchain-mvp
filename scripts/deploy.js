const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    throw new Error('No deployer configured. Set DEPLOYER_PRIVATE_KEY in .env.local');
  }

  console.log('Deploying FlowChainRewards with:', deployer.address);

  const factory = await hre.ethers.getContractFactory('FlowChainRewards');
  const contract = await factory.deploy(deployer.address);
  await contract.deployed();

  const address = contract.address;
  console.log('FlowChainRewards deployed to:', address);
  console.log('NEXT_PUBLIC_CONTRACT_ADDRESS=' + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
