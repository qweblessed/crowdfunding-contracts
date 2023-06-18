//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "hardhat/console.sol";

contract Crowdfunding is Ownable {
    struct Project {
        uint256 id;
        bytes32 name;
        bytes32 description;
        bytes32 url;
        uint256 goal;
        uint256 raisedAmount;
        uint256 endDateTs;
        address founder;
        bool isWithdrawn;
    }

    mapping(uint256 => Project) public projects;
    mapping(address => mapping(uint256 => uint256)) public investments;

    uint256 public immutable minInvestAmount;
    uint256 public immutable fee;
    uint256 public projectId;
    uint256 public earnedFees;

    event ProjectCreated(Project);
    event Funded(uint256 projectId, uint256 amount, address investor);
    event ReFunded(uint256 projectId, uint256 amount, address investor);
    event RaisedFundsReceived(
        uint256 projectId,
        uint256 amount,
        address founder
    );
    event Withdraw(uint256 amount);

    constructor(uint256 _minInvestAmount, uint256 _fee) {
        minInvestAmount = _minInvestAmount;
        fee = _fee;
    }

    function createProject(
        bytes32 name,
        bytes32 description,
        bytes32 url,
        uint256 goal,
        uint256 duration
    ) external {
        Project memory newProject = Project(
            projectId,
            name,
            description,
            url,
            goal,
            0,
            block.timestamp + duration,
            msg.sender,
            false
        );

        projects[projectId] = newProject;
        projectId += 1;

        emit ProjectCreated(newProject);
    }

    function fundInProject(uint256 id) external payable {
        Project storage project = projects[id];
        uint256 remaingAmount = _chargeFees(msg.value);
      
        require(
            !_isRaised(id) && !_isEnded(id),
            "Crowdfunding: !raise conditions"
        );

        project.raisedAmount += remaingAmount;
        investments[msg.sender][id] += remaingAmount;

        payable(address(this)).transfer(msg.value);

        emit Funded(id, msg.value, msg.sender);
    }

    function refundFromProject(uint256 id) external payable {
        require(
            !_isRaised(id) && _isEnded(id),
            "Crowdfunding: !refund conditions"
        );

        payable(msg.sender).transfer(investments[msg.sender][id]);
        delete investments[msg.sender][id];

        emit ReFunded(id, investments[msg.sender][id], msg.sender);
    }

    function receiveRaisedFunds(uint256 id) external payable {
        Project storage project = projects[id];

        require(
            !_isRaised(id) && _isEnded(id) && _isFounder(id),
            "Crowdfunding: !raise withdraw conditions"
        );

        payable(msg.sender).transfer(project.raisedAmount);
        project.isWithdrawn = true;

        emit RaisedFundsReceived(id, project.raisedAmount, msg.sender);
    }

    function withdraw() external onlyOwner {
        uint256 withdrawAmount = earnedFees;
        payable(owner()).transfer(withdrawAmount);

        earnedFees = 0;

        emit Withdraw(withdrawAmount);
    }

    function _chargeFees(uint256 amount)
        private
        returns (uint256 chargedAmount)
    {
        chargedAmount = (amount * fee) / 100;
        earnedFees += chargedAmount;

        return amount - chargedAmount;
    }

    function _isRaised(uint256 id) private returns (bool) {
        return projects[id].raisedAmount > projects[id].goal;
    }

    function _isEnded(uint256 id) private returns (bool) {

        return block.timestamp > projects[id].endDateTs;
    }

    function _isFounder(uint256 id) private returns (bool) {
        return msg.sender == projects[id].founder;
    }

    receive() external payable {}
}
