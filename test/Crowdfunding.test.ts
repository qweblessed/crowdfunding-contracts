/* eslint-disable camelcase */
import { JsonRpcProvider } from '@ethersproject/providers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';

import { Crowdfunding, Crowdfunding__factory } from '../typechain-types';

describe('Crowdfunding', function () {
  let CrowdfundingContract: Crowdfunding;
  let owner: Signer;
  let investor: Signer;
  let provider: JsonRpcProvider;
  beforeEach(async function () {
    [owner, investor] = await ethers.getSigners();
    provider = ethers.provider;

    CrowdfundingContract = await new Crowdfunding__factory(owner).deploy(
      ethers.utils.parseEther('0.1'),
      1,
    );
  });

  it('Should be able to create a new project', async function () {
    const currentTs = (await provider.getBlock('latest')).timestamp;

    await expect(
      CrowdfundingContract.connect(investor).createProject(
        ethers.utils.formatBytes32String('TEST Name'),
        ethers.utils.formatBytes32String('TEST Description'),
        ethers.utils.formatBytes32String('TEST URL'),
        ethers.utils.parseEther('10'),
        36000,
      ),
    )
      .to.emit(CrowdfundingContract, 'ProjectCreated')
      .withArgs([
        0,
        ethers.utils.formatBytes32String('TEST Name'),
        ethers.utils.formatBytes32String('TEST Description'),
        ethers.utils.formatBytes32String('TEST URL'),
        ethers.utils.parseEther('10'),
        0,
        currentTs + 36001,
        await investor.getAddress(),
        false,
      ]);
  });

  it('Should be able to fund a project', async function () {
    await CrowdfundingContract.connect(investor).createProject(
      ethers.utils.formatBytes32String('TEST Name'),
      ethers.utils.formatBytes32String('TEST Description'),
      ethers.utils.formatBytes32String('TEST URL'),
      ethers.utils.parseEther('10'),
      36000,
    );

    await expect(
      CrowdfundingContract.connect(investor).fundInProject(0, {
        value: ethers.utils.parseEther('1'),
      }),
    ).to.changeEtherBalances(
      [investor, CrowdfundingContract],
      [
        `-${ethers.utils.parseEther('1').toString()}`,
        ethers.utils.parseEther('1').toString(),
      ],
    );

    expect((await CrowdfundingContract.projects(0)).raisedAmount).to.be.eq(
      ethers.utils.parseEther('0.99'),
    );
  });

  it('Should allow refunding from a project after it ends', async function () {
    await CrowdfundingContract.connect(owner).createProject(
      ethers.utils.formatBytes32String('TEST Name'),
      ethers.utils.formatBytes32String('TEST Description'),
      ethers.utils.formatBytes32String('TEST URL'),
      ethers.utils.parseEther('10'),
      36000,
    );

    await CrowdfundingContract.connect(investor).fundInProject(0, {
      value: ethers.utils.parseEther('10'),
    });

    expect((await CrowdfundingContract.projects(0)).raisedAmount).to.be.eq(
      ethers.utils.parseEther('9.9'),
    );
    await expect(
      CrowdfundingContract.connect(investor).refundFromProject(0),
    ).to.be.revertedWith('Crowdfunding: !refund conditions');

    await provider.send('evm_increaseTime', [36000]);

    await expect(
      CrowdfundingContract.connect(investor).refundFromProject(0),
    ).to.changeEtherBalances(
      [await investor.getAddress(), CrowdfundingContract],
      [
        `${ethers.utils.parseEther('9.9').toString()}`,
        `-${ethers.utils.parseEther('9.9').toString()}`,
      ],
    );
  });

  it('Should allow the contract owner to withdraw earned fees', async function () {
    await CrowdfundingContract.connect(owner).createProject(
      ethers.utils.formatBytes32String('TEST Name'),
      ethers.utils.formatBytes32String('TEST Description'),
      ethers.utils.formatBytes32String('TEST URL'),
      ethers.utils.parseEther('10'),
      36000,
    );

    await CrowdfundingContract.connect(investor).fundInProject(0, {
      value: ethers.utils.parseEther('10'),
    });

    await expect(
      CrowdfundingContract.connect(owner).withdraw(),
    ).to.changeEtherBalances(
      [await owner.getAddress(), CrowdfundingContract],
      [
        `${ethers.utils.parseEther('0.1').toString()}`,
        `-${ethers.utils.parseEther('0.1').toString()}`,
      ],
    );
  });

  it('Should allow to receive raised money project', async function () {
    await CrowdfundingContract.connect(owner).createProject(
      ethers.utils.formatBytes32String('TEST Name'),
      ethers.utils.formatBytes32String('TEST Description'),
      ethers.utils.formatBytes32String('TEST URL'),
      ethers.utils.parseEther('10'),
      36000,
    );

    await CrowdfundingContract.connect(investor).fundInProject(0, {
      value: ethers.utils.parseEther('11'),
    });

    await expect(
      CrowdfundingContract.connect(owner).receiveRaisedFunds(0),
    ).to.changeEtherBalances(
      [await owner.getAddress(), CrowdfundingContract.address],
      [
        `${ethers.utils.parseEther('10.89').toString()}`,
        `-${ethers.utils.parseEther('10.89').toString()}`,
      ],
    );
  });
});
