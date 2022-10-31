// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

contract Hello {
    uint8 public myValue;

    function increase() public  returns (uint8) {
        myValue++;
        return myValue;

    }

    function decrease() public  returns (uint8) {
        myValue--;
        return myValue;

    }

    function setValue(uint8 newValue) public{
        myValue = newValue;
    }

    function getValue() public view returns (uint8){
        return myValue;
    }
}