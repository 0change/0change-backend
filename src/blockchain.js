const httpProvider = `https://${process.env.BLOCKCHAIN_NETWORK}.infura.io/v3/${process.env.INFURA_API_KEY}`;
const wssProvider = `wss://${process.env.BLOCKCHAIN_NETWORK}.infura.io/ws`;
const erc20ABI = require("../scripts/ERC20.json").abi;
const Web3 = require('web3');
const ethjsUnit = require('ethjs-unit');
const ethers = require("ethers");
var web3 = new Web3(new Web3.providers.HttpProvider(httpProvider));

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

function decimalToWeiUnit(decimals) {
    let unitMap = ethjsUnit.unitMap;
    for(let unit in unitMap){
        if(unitMap[unit] !== '0' && unitMap[unit].length === decimals+1)
            return unit;
    }
    throw {message: "Unknown token decimal number"};
}

function fromWei(value, decimals){
    // if(typeof value != "string")
    //     value = value.toString();
    // let unit = decimalToWeiUnit(decimals);
    // return web3.utils.fromWei(value, unit);
    return ethers.utils.formatUnits(value, decimals);
}

function toWei(value, decimals){
    if(typeof value != "string")
        value = value.toString();
    let unit = decimalToWeiUnit(decimals);
    return web3.utils.toWei(value, unit);
}

module.exports = {
    web3,
    fromWei,
    toWei,
    monitorWallet,
    createWallet
}
