const provider = "https://mainnet.infura.io/YSclbc3zNqU2a9Qeozmb";
const wssProvider = "wss://mainnet.infura.io/ws";
const erc20ABI = require("./ERC20.json").abi;
const Web3 = require('web3');

var web3 = new Web3(new Web3.providers.WebsocketProvider(wssProvider));

function monitorWallet(wallet, contractAddress, fromBlock, callback){
	web3.eth.getBlockNumber().then(function(lastBlock) {
        
        var contract = new web3.eth.Contract(erc20ABI, contractAddress);
        ret = contract.getPastEvents("Transfer", {
            fromBlock: fromBlock,
            toBlock: lastBlock,
            filter: {
                isError: 0,
                txreceipt_status: 1,
                to: wallet
            }/*,
            topics: [
                web3.utils.sha3("Transfer(address,address,uint256)"),
                null,
                web3.utils.padLeft(wallet, 64)
            ]*/
        }).then(function(events) {
            var events = events.map(function(tx) {
                return {
                    block_number: tx.blockNumber,
                    tx_hash: tx.transactionHash,
                    from: tx.returnValues.from,
                    to: tx.returnValues.to,
                    value: tx.returnValues.value,
                    current_block: lastBlock,
                    contract_address: contractAddress
                };
            });
            callback(null, {
            	lastBlock: lastBlock,
            	events: events
            });
        }).catch(function(err) {
            console.log(err);
            callback(err, null);
        });
    });
}

module.exports.run = function (wallet, tokenContractAddress, startBlockNumber, callback){
    monitorWallet(wallet, tokenContractAddress, startBlockNumber, function (error, response) {
        if(callback){
            callback(error, response);
        }else{
            // log response if callback is undefined.
            console.log('Response : ', JSON.stringify(response, null, 2));
        }
    })
}