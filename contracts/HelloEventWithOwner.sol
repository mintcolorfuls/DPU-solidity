// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "./Ownable.sol";

//สืบทอดความสามารถมาจาก Ownable
contract HelloEventWithOwner is Ownable {
    uint8 public myValue;
    constructor() {
        
    }

    event Increased(uint8 newValue, string message);
    event Decreased(uint8 newValue, string message);
    event ValueSet(uint8 newValue, string message);

    function increase() public {
        myValue++;
        emit Increased(myValue, "My value is Increased by 1");

    }

    function decrease() public {
        myValue--;
        emit Decreased(myValue, "My value is Decreased by 1");

    }

    function setValue(uint8 newValue) public isOwner {
        myValue = newValue;
        emit ValueSet(myValue, "My value is set with new value.");
    }
}