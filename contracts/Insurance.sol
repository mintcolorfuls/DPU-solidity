// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Insurance {
    address _manager;
    mapping(address => Customer) _customer;

    struct Customer {
        uint amount;
        uint lastPay;
    }

    constructor() {
        _manager = msg.sender;
    }

    modifier managerNotAvailable() {
        require(msg.sender != _manager, "Manager can't use");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == _manager, "Only manager can use");
        _;
    }

    event Register(address indexed customer, uint amount, uint time);
    event Pay(address indexed customer, uint amount, uint time);
    event Payback(address indexed customer, uint amount, uint time);

    function register() public payable managerNotAvailable {
        require(_customer[msg.sender].amount <= 0, "Your insurance already to use");
        require(msg.value > 0, "Your money to low");

        _customer[msg.sender].amount = msg.value;
        _customer[msg.sender].lastPay = block.timestamp;

        emit Register(msg.sender, msg.value, block.timestamp);
    } 

    function pay() public payable managerNotAvailable {
        require(msg.value == 1 ether, "Incerrect amount");
        require((_customer[msg.sender].lastPay + 30 days) <= block.timestamp, "It's not time to pay.");
        _customer[msg.sender].amount += msg.value;
        _customer[msg.sender].lastPay = block.timestamp;
        emit Pay(msg.sender, msg.value, block.timestamp);
    }

    function payback(address customer) public payable onlyManager {
        require(_customer[customer].amount > 0, "Insurance not registered");

        payable(customer).transfer(_customer[customer].amount);
        _customer[customer].amount = 0;
        emit Payback(customer, _customer[customer].amount, block.timestamp);
    }

    function getCustomer(address customer) public view returns(uint, uint) {
        return (_customer[customer].amount, _customer[customer].lastPay); 
    }
}