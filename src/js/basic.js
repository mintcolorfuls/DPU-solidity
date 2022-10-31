const WEB3_URL = `http://127.0.0.1:9545/`;

// Global variable
let web3, accounts, balances, transactionCounts;

async function init() {
    // ผู้ให้บริการ Web3 โดยใช้การสื่อสารด้วย Http
    const provider = new Web3.providers.HttpProvider(WEB3_URL);
    web3 = new Web3(provider);

    // (1) Populate Account Table
    await populateAccountTable();
    // (2) Common Information
    // (3) Setup Interface creation interface
    // (4) Tranfer Operation
        // Select Sender
        // Select Reciever / Recipent
}

async function populateAccountTable() {
    // ดึงข้อมูล account
    try 
    {
        accounts = await web3.eth.getAccounts();
        await getBalance();
        if (Array.isArray(accounts) && accounts.length > 0) {
            let htmlStr = '';
            for (let index = 0; index < accounts.length; index++) {
                const balanceEth = await web3.utils.fromWei(balances[index], 'ether');
                htmlStr += '<tr>';
                htmlStr += `<th scope="row">${index + 1}</th>`;
                htmlStr += `<td>${accounts[index]}</td>`;
                htmlStr += `<td>${Number(balanceEth).toFixed(8)}</td>`;
                htmlStr += `<td>${transactionCounts[index]}</td>`;
                htmlStr += '</tr>';
            }

            $('#accountList').html(htmlStr);
        }
    }
    catch (err) {
        console.log(err);
    }
    
}

async function getBalance() {
    balances = await Promise.all(accounts.map(async account => await web3.eth.getBalance(account)));
    // จำนวน transaction ที่แต่ละ account เคยทำ
    transactionCounts = await Promise.all(accounts.map(async account => await web3.eth.getTransactionCount(account)));
    // balances = [];
    // for (let i = 0; i < accounts.length; i++) {
    //     const balance = await web3.eth.getBalance(accounts[i]);
    //     balances.pust(balance);
    // }
}