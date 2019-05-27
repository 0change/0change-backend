const provider = `https://${process.env.BLOCKCHAIN_NETWORK}.infura.io/YSclbc3zNqU2a9Qeozmb`;
const wssProvider = `wss://${process.env.BLOCKCHAIN_NETWORK}.infura.io/ws`;
const erc20ABI = require("./ERC20.json").abi;
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.WebsocketProvider(wssProvider));

module.exports.run = function (walletAddress, tokenContractAddress){
        // Get ERC20 Token contract instance
        console.log(`checking balance >> wallet: [${walletAddress}] contract: [${tokenContractAddress}]`);
        let contract = new web3.eth.Contract(erc20ABI, tokenContractAddress);
        // Call balanceOf function
        return contract.methods.balanceOf(walletAddress).call().then(balance => {
            console.log(`balance: [${balance}]`);
            return web3.utils.fromWei(web3.utils.toBN(balance));
        });
}