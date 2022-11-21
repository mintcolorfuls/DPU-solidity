const WEB3_URL = `ws://127.0.0.1:8545/`;

// Global variable
let web3, accounts, balances, borrowIndex, payerIndex, borrower, payer;
let owner, contractAddress, debts, simpleLoan;

const DEFAULT_OPTION = -1;

async function init() {
    let provider;
    if(WEB3_URL.startsWith("ws")) {
        provider = new Web3.providers.WebsocketProvider(WEB3_URL);
    } else {
        provider = new Web3.providers.HttpProvider(WEB3_URL);
    }
    
    web3 = new Web3(provider);
    accounts = await web3.eth.getAccounts();
    await deployContract();
    //await populateAccountTable();
}

async function setupBorrowButton() {
    $('#BorrowBtn').on('click', async e => {
        let borrowAmount = parseFloat($('#BorrowAmount').val());
        if(isNaN(borrowAmount) || typeof borrower == undefined) return;
    });
    const amount = web3.utils.toWei(String(borrowAmount), 'ether');
    try {
        const estGas = await simpleLoan.borrow.estimateGas(amount, {from: borrower}); //คำนวณค่า gas
        const sedingGas = Math.ceil(estGas * 1.5);
        const { receipt } = await simpleLoan.borrow(amount, {from: borrower, gas: sedingGas});
        updateBorrowLog(receipt);
        await getLoanInfo();
        await populateAccountTable();
    } catch(err) {
        console.log(err);
        alert('Unable to borrow');
        return;
    }
    finally {
        ResetBorrowControl()
    }
}

function ResetBorrowControl() {
    $('BorrowAmount').val('');
    $('Borrowers').val(-1);
    //$('PaybackBorrowers').val(-1);
}

function updateBorrowLog(receipt) {
    const logEntry = 
    `<li>
        <p>TxHash: ${receipt.transactionHash}</p>
        <p>BlockNumber: ${receipt.BlockNumber}</p>
        <p>Borrower ${receipt.from}</p>
        <p>Gas used ${receipt.cumulativeGasUsed}</p>
    </li>`;
    $('BorrowTxLog').append(logEntry);
}

async function updateSelectOptions() {
    if(!Array.isArray(accounts) || !accounts.length > 0) {
        return;
    }

    let borrowerOptions = `<option value='-1'>Select borrower account</option>`;
    for(let i = 1; i < accounts.length; i++) {
        borrowerOptions += `<option value='${i}'>(${i+1}) ${accounts[i]}</option>`;
    }
    $('#Borrowers').html(borrowerOptions)
    $('#PaybackBorrowers').html(borrowerOptions)
    $('#Borrowers').on('change', async e => {
        borrowIndex = e.target.value;
        borrower = accounts[borrowIndex];
    });
    $('#PaybackBorrowers').on('change', async e => {
        payerIndex = e.target.value;
        payer = accounts[payerIndex];
    })
}

async function firstTimeDeposit() {
    owner = accounts[0];
    const firstDeposit = web3.utils.toWei('20', 'ether');

    try {
        await simpleLoan.deposit({value: firstDeposit, from: owner});
    } catch (err) {
        console.log(err);
    }
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
            await updateSelectOptions();
            await setupBorrowButton();
            await setupPaybackButton();
            await setupEventListener();
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

async function setupPaybackButton() {
    $('#PaybackBtn').on('click', async e => {
        let paybackAmount = parseFloat($('#PaybackAmount').val());
        if(isNaN(borrowAmount) || typeof payer == undefined) return;
    });
    const amount = web3.utils.toWei(String(paybackAmount), 'ether');
    try {
        const estGas = await simpleLoan.payback.estimateGas({value: amount, from: payer}); //คำนวณค่า gas
        const sedingGas = Math.ceil(estGas * 1.5);
        const {receipt} = await simpleLoan.payback({value: amount, from: payer, gas: sedingGas});
        updatePaybackLog(receipt);
        await getLoanInfo();
        await populateAccountTable();
    } catch(err) {
        console.log(err);
        alert('Unable to borrow');
        return;
    }
    finally {
        ResetPaybackControl()
    }
}

function ResetPaybackControl() {
    $('#PaybackAmount').val('');
    $('#PaybackBorrowers').val(-1);
    //$('PaybackBorrowers').val(-1);
}

function updatePaybackLog(receipt) {
    const logEntry = 
    `<li>
        <p>TxHash: ${receipt.transactionHash}</p>
        <p>BlockNumber: ${receipt.BlockNumber}</p>
        <p>Payer ${receipt.from}</p>
        <p>Gas used ${receipt.cumulativeGasUsed}</p>
    </li>`;
    $('#PaybackTxLog').append(logEntry);
}

async function setupEventListener() {
    simpleLoan.Deposited().on('data', e => {
        //รับข้อมูลที่ถูกส่งมา 
        // js จะแปรงมิลลิวิเป็น date ให้
        //แปรง วินาที เป็น มิลลิวิ
        const dateTime = new Date(e.returnValue.time * 1000).toLocaleString();

        //รับเงินจากอีเว้น แล้วนำแปรงจาก เว้ย เป็น อีเทอร์
        const amountEther = web3.utils.fromWei(e.returnValue.amount, 'ether');
        const html = `<li class='lead' >[Deposited]:Owner has deposited ${amountEther} ETher at ${dateTime}</li>`;
        $('#EventLog').append(html);
    });

    simpleLoan.InterestRateChanged().on('data', e => {
        const newRate = e.returnValue.newRate;
        const dateTime = new Date(e.returnValue.time * 1000).toLocaleString();
        const html = `<li class='lead'>[InterestRateChanged]:Interest rate has change to ${newRate}% at ${dateTime}</li>`;
        $('#EventLog').append(html);
    });

    simpleLoan.Borrwed().on('data', e => {
        const dateTime = new Date(e.returnValue.time * 1000).toLocaleString();
        const amountEther = web3.utils.fromWei(e.returnValue.amount, 'ether');
        const borrower = e.returnValue.borrower;
        const html = `<li class='lead'>[Borrwed]:Borrower(${borrower}) has borrowed ${amountEther} Ether at ${dateTime}</li>`;
        $('#EventLog').append(html);
    });
    simpleLoan.Paybacked().on('data', e => {
        const dateTime = new Date(e.returnValue.time * 1000).toLocaleString();
        const amountEther = web3.utils.fromWei(e.returnValue.amount, 'ether');
        const borrower = e.returnValue.borrower;
        const remainingEther = web3.utils.fromWei(e.returnValue.remaining, 'ether');
        const html = `<li class='lead'>[Paybacked]:Borrower(${borrower}) has repaid ${amountEther} Ether(${remainingEther} Ether remaining) at ${dateTime}</li>`;
        $('#EventLog').append(html);
    });
    simpleLoan.LatePayback().on('data', e => {
        const dateTime = new Date(e.returnValue.time * 1000).toLocaleString();
        const amountEther = web3.utils.fromWei(e.returnValue.amount, 'ether');
        const borrower = e.returnValue.borrower;
        const remainingEther = web3.utils.fromWei(e.returnValue.remaining, 'ether');
        const period = e.returnValue.period;

        const html = `<li class='lead'>
        [LatePayback]:Borrower(${borrower}) 
        has repaid ${amountEther} 
        Ether(${remainingEther} Ether remaining)
         at ${dateTime} (LATE BY: ${period} seconds)</li>`;

        $('#EventLog').append(html);
    });
    simpleLoan.deptClreared().on('data', e => {
        const dateTime = new Date(e.returnValue.time * 1000).toLocaleString();
        const borrower = e.returnValue.borrower;

        const html = `<li class='lead'>
        [deptClreared]:Borrower(${borrower}) has repaid all deby at ${dateTime}</li>`;

        $('#EventLog').append(html);
    });
    simpleLoan.Withdraw().on('data', e => {
        const dateTime = new Date(e.returnValue.time * 1000).toLocaleString();
        const amountEther = web3.utils.fromWei(e.returnValue.amount, 'ether');
        const html = `<li class='lead' >[Withdraw]:Owner has withdraw ${amountEther} ETher at ${dateTime}</li>`;
        $('#EventLog').append(html);
    });
    simpleLoan.ClosedDown().on('data', e => {
        const dateTime = new Date(e.returnValue.time * 1000).toLocaleString();
        const html = `<li class='lead' >[ClosedDown]:Simple loan contract is destroyed at ${dateTime}</li>`;
        $('#EventLog').append(html);
    });
}
