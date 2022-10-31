// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

contract Ownable {

    address private owner;

    // ทำงานทุกครั้งที่เปลี่ยนเจ้าของ
    // indexed จะทำให้เราสามารถ searching ได้
    event OwnerSet(address indexed oldOwner, address indexed newOwner);
    constructor() {
        // เก็บข้อมูลของคนทำ transaction
        owner = msg.sender;
        emit OwnerSet(address(0), owner);
    }

    // modifier ใช้ร่วมกับ func ทำให้ func มีคุณสมบัติพิเศษเพิ่มขึ้นไป
    modifier isOwner {
        require(msg.sender == owner, "Caller is not owner");
        _; //ให้ทำงาน function ที่มันดูแลได้
    }

    // เรียกใช้ได้เฉพาะเจ้าของคนปัจจุบัน เพราะเราเอา Modifire ไปแปะ
    function changeOwner(address newOwner) public isOwner {
        emit OwnerSet(owner, newOwner);
        owner = newOwner;
    }

    // ใส้ view ไว้เพื่อให้มันดูได้อย่างเดียว
     function getOwner() public view returns (address) {
        return owner;
    }
}