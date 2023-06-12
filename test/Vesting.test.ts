/* eslint-disable camelcase */
import { expect } from 'chai';
import { BigNumber, Signer, Wallet } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import keccak256 from 'keccak256';
import { MerkleTree } from 'merkletreejs';

import {
  TestERC20,
  MerkleVesting,
  MerkleVesting__factory,
  TestERC20__factory,
} from '../typechain-types';

type Leaf = {
  address: string;
  amount: BigNumber;
};

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

describe('MerkleVesting', function () {
  let deployer: Signer;
  let Erc20: TestERC20;
  let VestingContract: MerkleVesting;
  let vestingAddressBalance: BigNumber;

  beforeEach(async () => {
    console.log('here');

    const [signer] = await ethers.getSigners();
    console.log('her123');
    Erc20 = await new TestERC20__factory(signer).deploy();
    VestingContract = await new MerkleVesting__factory(signer).deploy(
      Erc20.address,
    );
    vestingAddressBalance = (
      await Erc20.balanceOf(await signer.getAddress())
    ).div(2);

    await Erc20.transfer(VestingContract.address, vestingAddressBalance);
    deployer = signer;
  });

  it('Should emit Vest event with correct data when vesting tokens', async function () {
    const addreses: Leaf[] = [];

    for (let i = 0; i < 10; i++) {
      const addr = await ethers.provider.getSigner(i).getAddress();

      addreses.push({
        address: addr,
        amount: ethers.utils.parseEther(
          getRandomInt(1000 * (i + 1)).toString(),
        ),
      });
    }

    const leafs = addreses.map((leaf: Leaf) => {
      return ethers.utils.solidityPack(
        ['address', 'uint256'],
        [leaf.address, leaf.amount],
      );
    });

    const merkleTree = new MerkleTree(leafs, keccak256, {
      hashLeaves: true,
      sortPairs: true,
    });

    await expect(
      VestingContract.connect(deployer).vestTokens(merkleTree.getHexRoot()),
    )
      .to.emit(VestingContract, 'Vest')
      .withArgs(merkleTree.getHexRoot());

    const user = await ethers.provider.getSigner(1);
    await expect(
      VestingContract.connect(user).claimTokens(
        addreses[1].amount,
        merkleTree.getHexProof(keccak256(leafs[2])),
      ),
    ).to.be.revertedWith('Vesting: cannot claim');

    await expect(
      VestingContract.connect(user).claimTokens(
        addreses[2].amount,
        merkleTree.getHexProof(keccak256(leafs[1])),
      ),
    ).to.be.revertedWith('Vesting: cannot claim');

    for (let i = 0; i < addreses.length; i++) {
      const signer = await ethers.provider.getSigner(i);

      await expect(
        VestingContract.connect(signer).claimTokens(
          addreses[i].amount,
          merkleTree.getHexProof(keccak256(leafs[i])),
        ),
      )
        .to.emit(VestingContract, 'Claim')
        .withArgs(addreses[i].address, addreses[i].amount)
        .changeTokenBalance(Erc20, addreses[i].address, addreses[i].amount);
    }

    await expect(
      VestingContract.connect(user).claimTokens(
        addreses[1].amount,
        merkleTree.getHexProof(keccak256(leafs[1])),
      ),
    ).to.be.revertedWith('Vesting: cannot claim');
  });
});
