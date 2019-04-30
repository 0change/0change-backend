const provider = "https://ropsten.infura.io/YSclbc3zNqU2a9Qeozmb";
const wssProvider = "wss://ropsten.infura.io/ws";
const erc20ABI = require("./ERC20.json").abi;
const simpleWalletABI = require("./SimpleWallet.json").abi;
const simpleWalletFactoryABI = require("./SimpleWalletFactory.json").abi;
const Web3 = require('web3');

const factoryContractAddress = "0x24975746ed0E403F82c4370F4031c62866Be9439";
const privateKey = process.env.PRIVATE_KEY;
const operatorWallet = "0xc5627c0ab633c615bb76ac1f4b8ae3a65aa7dcb1";
const web3 = new Web3(new Web3.providers.HttpProvider(provider));

var SimpleWalletFactory = new web3.eth.Contract(simpleWalletFactoryABI, 
    factoryContractAddress);

// unlock account
var account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);

var id = Math.floor(Math.random()*100000000000);
SimpleWalletFactory.methods.create(id).estimateGas({
        from: operatorWallet
}).then(function(gasAmount){
    SimpleWalletFactory.methods.create(id).send({
        from: operatorWallet,
        gas: gasAmount
    }).on('confirmation', function(confirmationNumber, receipt){
         console.log(receipt.events.New.returnValues.addr);
         process.exit(0);
    });
    /*.on("receipt", function(receipt){
        console.log(receipt.events.New.returnValues.addr);
    });*/
});
