const provider = `https://${process.env.BLOCKCHANE_NETWORK}.infura.io/YSclbc3zNqU2a9Qeozmb`;
const wssProvider = `wss://${process.env.BLOCKCHANE_NETWORK}.infura.io/ws`;
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.WebsocketProvider(wssProvider));

module.exports.run = function (txHash){
    console.log({
        method: 'getTransaction',
        wssProvider,
        txHash
    });
    return web3.eth.getTransactionReceipt(txHash);
}