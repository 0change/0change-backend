const blockchain = require('../src/blockchain')
const erc20ABI = require("./ERC20.json").abi;

module.exports.run = function (walletAddress, tokenContractAddress, tokenDecimals) {
    let web3 = blockchain.web3;
    // Get ERC20 Token contract instance
    console.log(`checking balance >> wallet: [${walletAddress}] contract: [${tokenContractAddress}]`);
    let contract = new web3.eth.Contract(erc20ABI, tokenContractAddress);
    // Call balanceOf function
    return contract.methods.balanceOf(walletAddress).call().then(balance => {
        console.log(`balance: [${balance}]`);
        // TODO: apply decimals
        return blockchain.fromWei(balance, tokenDecimals);
    });
}