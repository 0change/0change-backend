var refreshScript = require('./wallet_refresh');

const MAINNET_DAI_CONTRACT_ADDRESS = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";
const ROPSTEN_TCN_CONTRACT_ADDRESS = "0x5429a4ce40601426b6750D3FE14b9cA4441101ea";

var contractAddress = MAINNET_DAI_CONTRACT_ADDRESS;
var wallet = "0x736cc8fa92fc18ae6a486d92c6d5ec096cc017d7";

refreshScript.run(wallet, contractAddress, 7681750, function(err, resp){
    console.log(resp.lastBlock);
    console.log(resp.events);

    process.exit(0);
});