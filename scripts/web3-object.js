const provider = "https://mainnet.infura.io/YSclbc3zNqU2a9Qeozmb";
const wssProvider = "wss://mainnet.infura.io/ws";
const erc20ABI = require("./ERC20.json").abi;
const Web3 = require('web3');

var web3 = new Web3(new Web3.providers.WebsocketProvider(wssProvider));

module.exports = web3;