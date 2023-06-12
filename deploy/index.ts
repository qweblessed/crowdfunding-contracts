/* eslint-disable prettier/prettier */
import { ethers } from 'hardhat';

async function main() {
  const VestingCotractFactory = await ethers.getContractFactory(
    'MerkleVesting',
  );
  const VestingCotract = await VestingCotractFactory.deploy(
    process.env.VESTED_TOKEN,
  );
  await VestingCotract.deployed();
  console.log('VestingCotract deployed to', VestingCotract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
