/* eslint-disable camelcase */
import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';

import { Crowdfunding, Crowdfunding__factory } from '../typechain-types';

describe('Crowdfunding', function () {
  let CrowdfundingContract: Crowdfunding;
  let owner: Signer;
  let investor: Signer;
  beforeEach(async function () {
    [owner, investor] = await ethers.getSigners();

    CrowdfundingContract = await new Crowdfunding__factory(owner).deploy(
      ethers.utils.parseEther('0.1'),
      1,
    );
  });

  it('Should create a new project', async function () {
    const provider = ethers.provider;
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
        2,
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

  it.only('Should fund a project', async function () {
    // Create a project
    await CrowdfundingContract.connect(investor).createProject(
      ethers.utils.formatBytes32String('TEST Name'),
      ethers.utils.formatBytes32String('TEST Description'),
      ethers.utils.formatBytes32String('TEST URL'),
      ethers.utils.parseEther('10'),
      36000,
    );

    await CrowdfundingContract.connect(investor).fundInProject(0, {
      value: ethers.utils.parseEther('1'),
    });

    // Get the updated raised amount for the project
    // const updatedRaisedAmount = (await crowdfunding.projects(projectId))
    //   .raisedAmount;

    // // Assert that the project was funded successfully
    // expect(updatedRaisedAmount).to.equal(initialRaisedAmount.add(fundAmount));
  });

  // it('Should allow refunding from a project after it ends', async function () {
  //   // Create a project with a short duration
  //   await crowdfunding.createProject(
  //     'Project Name',
  //     'Project Description',
  //     'Project URL',
  //     1000,
  //     0,
  //     10, // Duration of 10 seconds
  //   );

  //   // Get the project ID
  //   const projectId = 0;

  //   // Fund the project
  //   const fundAmount = 500;
  //   await crowdfunding
  //     .connect(investor)
  //     .fundInProject(projectId, { value: fundAmount });

  //   // Advance time to make the project end
  //   await network.provider.send('evm_increaseTime', [11]); // Increase time by 11 seconds

  //   // Refund from the project
  //   const initialInvestorBalance = await ethers.provider.getBalance(
  //     investor.address,
  //   );
  //   await crowdfunding.connect(investor).refundFromProject(projectId);
  //   const finalInvestorBalance = await ethers.provider.getBalance(
  //     investor.address,
  //   );

  //   // Assert that the investor received the refund
  //   expect(finalInvestorBalance).to.equal(
  //     initialInvestorBalance.add(fundAmount),
  //   );
  // });

  // // Test case: Withdrawing earned fees by the contract owner
  // it('Should allow the contract owner to withdraw earned fees', async function () {
  //   // Create a project
  //   await crowdfunding.createProject(
  //     'Project Name',
  //     'Project Description',
  //     'Project URL',
  //     1000,
  //     0,
  //     3600,
  //   );

  //   // Get the project ID
  //   const projectId = 0;

  //   // Fund the project
  //   const fundAmount = 500;
  //   await crowdfunding
  //     .connect(investor)
  //     .fundInProject(projectId, { value: fundAmount });

  //   // Get the initial balance of the contract owner
  //   const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

  //   // Withdraw earned fees by the contract owner
  //   await crowdfunding.connect(owner).withdraw();

  //   // Get the final balance of the contract owner
  //   const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

  //   // Calculate the expected earned fees
  //   const earnedFees = (fundAmount * fee) / 100;

  //   // Assert that the contract owner received the earned fees
  //   expect(finalOwnerBalance).to.equal(initialOwnerBalance.add(earnedFees));
  // });

  // it('Should revert when attempting to fund an already raised project', async function () {
  //   // Create a project
  //   await crowdfunding.createProject(
  //     'Project Name',
  //     'Project Description',
  //     'Project URL',
  //     1000,
  //     1000,
  //     3600,
  //   );

  //   // Get the project ID
  //   const projectId = 0;

  //   // Attempt to fund the project
  //   const fundAmount = 500;
  //   await expect(
  //     crowdfunding
  //       .connect(investor)
  //       .fundInProject(projectId, { value: fundAmount }),
  //   ).to.be.revertedWith('Crowdfunding: !raise conditions');
  // });

  // // Test case: Attempt to withdraw raised funds without meeting conditions
  // it('Should revert when attempting to withdraw raised funds without meeting conditions', async function () {
  //   // Create a project
  //   await crowdfunding.createProject(
  //     'Project Name',
  //     'Project Description',
  //     'Project URL',
  //     1000,
  //     0,
  //     3600,
  //   );

  //   // Get the project ID
  //   const projectId = 0;

  //   // Attempt to withdraw raised funds
  //   await expect(
  //     crowdfunding.connect(founder).receiveRaisedFunds(projectId),
  //   ).to.be.revertedWith('Crowdfunding: !raise withdraw conditions');
  // });

  // it('Should revert when attempting to refund from a project that is not ended', async function () {
  //   // Create a project
  //   await crowdfunding.createProject(
  //     'Project Name',
  //     'Project Description',
  //     'Project URL',
  //     1000,
  //     0,
  //     3600,
  //   );

  //   // Get the project ID
  //   const projectId = 0;

  //   // Attempt to refund from the project
  //   await expect(
  //     crowdfunding.connect(investor).refundFromProject(projectId),
  //   ).to.be.revertedWith('Crowdfunding: !refund conditions');
  // });

  // // Test case: Attempt to withdraw fees without being the owner
  // it('Should revert when attempting to withdraw fees without being the owner', async function () {
  //   // Attempt to withdraw fees as a non-owner account
  //   await expect(crowdfunding.connect(investor).withdraw()).to.be.revertedWith(
  //     'Ownable: caller is not the owner',
  //   );
  // });
});
