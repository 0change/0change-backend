const provider = "https://mainnet.infura.io/YSclbc3zNqU2a9Qeozmb";
const wssProvider = "wss://mainnet.infura.io/ws";
const erc20ABI = require("../scripts/ERC20.json").abi;
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.WebsocketProvider(wssProvider));

function monitorWallet(wallet, contractAddress, fromBlock){
    let lastBlock = 0;
    return web3.eth.getBlockNumber()
        .then(value => {
            lastBlock = value;
            console.log('last block: ', lastBlock);
            let contract = new web3.eth.Contract(erc20ABI, contractAddress);
            return contract.getPastEvents("Transfer", {
                fromBlock: fromBlock,
                toBlock: lastBlock,
                filter: {
                    isError: 0,
                    txreceipt_status: 1,
                    to: wallet
                },
            })
        })
        .then(_events => {
            let events = _events.map(tx => ({
                block_number: tx.blockNumber,
                tx_hash: tx.transactionHash,
                from: tx.returnValues.from,
                to: tx.returnValues.to,
                value: tx.returnValues.value,
                current_block: lastBlock,
                contract_address: contractAddress
            }));
            return {
                lastBlock: lastBlock,
                events: events
            };
        })
}

function createWallet(){
    return web3.eth.accounts.create();
}

module.exports = {
    monitorWallet,
    createWallet
}