// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0 < 0.9.0;

contract Greeter {
    string greeting;
    address owner;
    modifier onlyOwner {
    require(msg.sender == owner, "Only the owner of this contract can set the value");
    _;
    }

    constructor(){
    greeting = "Hello World again";
    owner = msg.sender;
    }

    function getValue() public view returns(string memory) {
        return greeting;
    }

    function setValue(string memory _greeting) public onlyOwner{
        greeting = _greeting;
    }
}
