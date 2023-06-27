/* eslint-disable prettier/prettier */
import { ethers } from 'hardhat';

async function main() {
  const CrowdfundingContractFactory = await ethers.getContractFactory(
    'Crowdfunding',
  );
  const CrowdfundingContract = await CrowdfundingContractFactory.deploy(
    ethers.utils.parseEther('0.1'),
    1,
  )
  
  await CrowdfundingContract.deployed();
  console.log('CrowdfundingContract deployed to', CrowdfundingContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
