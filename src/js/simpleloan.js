const WEB3_URL = `http://127.0.0.1:9545/`;

// Global variable
let web3, accounts, balances, borrowIndex, payerIndex, borrower, payer;
let owner, contractAddress, debts, simpleLoan;

const DEFAULT_OPTION = -1;

async function init() {
    const provider = new Web3.providers.HttpProvider(WEB3_URL);
    web3 = new Web3(provider);
    accounts = await web3.eth.getAccounts();
    await deployContract();
    //await populateAccountTable();
}

async function getLoanInfo() {
    owner = accounts[0];
    $('#LoanOwner').html(owner);
    $('#LoanContractAddress').html(contractAddress);
    const firstDeposit = web3.utils.toWei('20', 'ether');
    // เวลาเรียกใช้จะต้องส่ง (parameter, data => json obj)
    // value คือ เงิน
    await simpleLoan.deposit({value: firstDeposit, from: owner}); // เรียกใช้ฟังชันก์ที่เราเขียนไว้ใน solidity
    const contractBalance = await web3.eth.getBalance(contractAddress);
    $('#LoanContractBalance').html(web3.utils.fromWei(contractBalance, 'ether'));
    const borrowers = await simpleLoan.getBorrowers.call();
    $('#BorrowerCount').html(borrowers.length);

    const rateNumberator = await simpleLoan.interestRateNumberator.call();
    const rateDenominator = await simpleLoan.interestRateDenominator.call();
    const interestRate = Number((rateNumberator * 100 / rateDenominator)).toFixed(2);
    $('#InterestRate').html(interestRate);

    //await populateAccountTable(); // update เงิน
}

async function deployContract() {
    // ABI = Application blockchain interface
    $.getJSON('SimpleLoan.json', async contractABI => {
        const contract = TruffleContract(contractABI);
        contract.setProvider(web3.currentProvider);
        try {
            simpleLoan = await contract.deployed();
            contractAddress = simpleLoan.address;
            console.log('Simple loan contract', simpleLoan);
            await getLoanInfo();
            await populateAccountTable();
        } catch (err) {
            console.log(err)
        }
    });
}

async function getDebtInfo(parems) {
    const borrowers = await simpleLoan.getBorrowers.call();
    debts = await Promise.all(borrowers.map(async borrower => {
        await simpleLoan.getDebt(borrower)
    }))
}

async function populateAccountTable() {
    // ดึงข้อมูล account
    try 
    {
        //accounts = await web3.eth.getAccounts();
        await getBalance();
        await getDebtInfo();

        const borrowers = await simpleLoan.getBorrowers.call(); //เรียกข้อมูลมาดู
        const currentDebts = []; //เก็บหนี้ของทั้ง 10 คน
        for(let i = 0; i < accounts.length; i++) {
            let found = false; //ใช้เช็คว่าหาเจอหรือไม่
            for(let j = 0; j < borrowers.length; j++) { //ลูปใน array ที่เก็บรายชื่อของผู้กู้
                if(accounts[i] == borrowers[j]) {
                    currentDebts[i] = web3.utils.fromWei(debts[j], 'ether');
                    found = true;
                    break;
                }
            }
            if(!found) {
                currentDebts[i] = 0;
            }
        }

        if (Array.isArray(accounts) && accounts.length > 0) {
            let htmlStr = '';
            for (let index = 0; index < accounts.length; index++) {
                const balanceEth = await web3.utils.fromWei(balances[index], 'ether');
                htmlStr += '<tr>';
                htmlStr += `<th scope="row">${index + 1}</th>`;
                htmlStr += `<td>${accounts[index]}</td>`;
                htmlStr += `<td>${Number(balanceEth).toFixed(8)}</td>`;
                htmlStr += `<td>${currentDebts[index]}</td>`;
                htmlStr += '</tr>';
            }
            // ${web3.utils.fromWei(debts[index], 'ether')}
            $('#AccountList').html(htmlStr);
        }
    }
    catch (err) {
        console.log(err);
    }
    
}

async function getBalance() {
    balances = await Promise.all(accounts.map(async account => await web3.eth.getBalance(account)));
}