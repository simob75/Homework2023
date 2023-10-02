// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./Token.sol";
import "hardhat/console.sol";


contract Crowdsale{
	Token public token;
	uint256 public price;
	uint256 public maxTokens;
	uint256 public tokenSold;
	address public owner;
	//add status to the contract
	enum Status { Open, Closed }
    	Status public status = Status.Closed;
    	bytes32 public currStatus = "Closed";
    	uint256 timeToBuy;
    	//end
	mapping(address=>bool) public allowList;

	event Buy(uint256 _amount, address indexed _buyer);
	event Finalize(uint256 _tokenSold, uint256 _ethRaised);

	modifier onlyOwner(){
		require(msg.sender == owner, "caller must be owner");
		_;
	}


	constructor(
		Token _token,
		uint256 _price,
		uint256 _maxTokens)
	{
		owner = msg.sender;
		token = _token;
		price = _price;
		maxTokens = _maxTokens;
	}

	//Set status
	function setCurrStatus(Status _status) internal{
        if ( _status == Status.Closed) {
            currStatus = "Closed";
        } else if (_status == Status.Open) {
            currStatus = "Open";
        }
    }
    //onlyOwner
    function isOpen() public onlyOwner returns(bool){
    timeToBuy = block.timestamp;
    status = Status.Open;
    setCurrStatus(status);
    return status == Status.Open;   
    }

    //onlyOwner
    function isClosed() public onlyOwner returns(bool){
    timeToBuy = block.timestamp;
    status = Status.Closed;
    setCurrStatus(status);
    return status == Status.Closed;   
    }
    //End set status code


	receive() external payable{
		uint256 amount = msg.value / price;
		buyTokens(amount * 1e18);
	}

	function setAllowList(address _allowed) external onlyOwner{
        allowList[_allowed] = true;
    }

	function buyTokens(uint256 _amount) public payable {
		require(timeToBuy <= block.timestamp);
        require(status == Status.Open);
		require(allowList[msg.sender]==true, 'Address not withelisted');
		require(msg.value == (_amount / 1e18)* price, 'Not enough ether');
		require(token.balanceOf(address(this))>= _amount);
		require(token.transfer(msg.sender, _amount));

		tokenSold += _amount;

		emit Buy(_amount, msg.sender);
	}

	function setPrice(uint256 _price) public onlyOwner{
		price = _price;
	}

	function finalize() public onlyOwner{
		//require(msg.sender == owner);
		uint256 valueBeforeFinalizing = token.balanceOf(address(this));
		require(token.transfer(owner, token.balanceOf(address(this))));
		uint256 value2 = token.balanceOf(address(this));
		uint256 value = address(this).balance;
		(bool sent, bytes memory data) = owner.call{ value: value }("");
		require(sent);

		emit Finalize(tokenSold, value);
	}

}
