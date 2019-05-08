require('dotenv').config({});

const Wallet = require('../src/database/mongooseModels/Wallet');

const provider = "https://mainnet.infura.io/YSclbc3zNqU2a9Qeozmb";
const wssProvider = "wss://mainnet.infura.io/ws";
const erc20ABI = require("./ERC20.json").abi;
const simpleWalletABI = require("./SimpleWallet.json").abi;
const simpleWalletFactoryABI = require("./SimpleWalletFactory.json").abi;
const Web3 = require('web3');

const factoryContractAddress = process.env.FACTORY_CONTRACT_ADDRESS;
const privateKey = process.env.SC_OPERATOR_PRIVATE_KEY;
const operatorWallet = process.env.SC_OPERATOR_WALLET;

const web3 = new Web3(new Web3.providers.HttpProvider(provider));

var SimpleWalletFactory = new web3.eth.Contract(simpleWalletFactoryABI, 
    factoryContractAddress);

// unlock account
var account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);

var run = function (callback) {
    let id = Math.floor(Math.random()*100000000000);
    SimpleWalletFactory.methods.create(id).estimateGas({
        from: operatorWallet
    }).then(function(gasAmount){
        SimpleWalletFactory.methods.create(id).send({
            from: operatorWallet,
            gas: gasAmount
        }).on('confirmation', function(confirmationNumber, receipt){
            // console.log('address: ', receipt.events.New.returnValues.addr);
            return callback(receipt.events.New.returnValues.addr);
        });
        /*.on("receipt", function(receipt){
            console.log(receipt.events.New.returnValues.addr);
        });*/
    });
}
module.exports.run = run;

// run(function(out){
//     console.log(out);
//     process.exit(0);
// });
