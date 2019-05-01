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

const MAINNET_DAI_CONTRACT_ADDRESS = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";
const ROPSTEN_TCN_CONTRACT_ADDRESS = "0x5429a4ce40601426b6750D3FE14b9cA4441101ea";

var contractAddress = MAINNET_DAI_CONTRACT_ADDRESS;
var wallet = "0xAE05334651e6A5844fb76e8F792E65426892C15e";

monitorWallet(wallet, contractAddress, 7674380, function(err, resp){
	console.log(resp.lastBlock);
	console.log(resp.events);

	process.exit(0);
});