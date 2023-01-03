import { Substreams, download } from "../dist";
import { decodeAccount } from "./abi/eosio.token";
import { Account } from "./interfaces";
import { Name, Asset } from "@greymass/eosio";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "https://eos.mypinata.cloud/ipfs/QmbttxBK9FbV8E8g8g8jp8rpYDvK8QzEwSx4bQmafngXpJ";
const outputModules = ["store_accounts"];
const startBlockNum = "2";
const stopBlockNum = "1000";

// Initialize Substreams
const substreams = new Substreams(host, {
    startBlockNum,
    stopBlockNum,
    outputModules,
});

(async () => {
    // download Substream from IPFS
    const {modules, registry} = await download(substream);
    
    // Find Protobuf message types
    const Account = registry.findMessage("antelope.eosio.token.v1.Account");
    if ( !Account) throw new Error("Could not find Account message type");

    substreams.on("storeDeltas", output => { 
        for ( const { key, newValue } of output.data.storeDeltas.deltas ) {
            if ( output.name == "store_accounts") {
                let [table_name, owner, contract, symcode] = key.split(":");
                symcode = Asset.SymbolCode.from(Name.from(symcode).value).toString();
                const binary: Account = Account.fromBinary( newValue ) as any;
                const account = decodeAccount(binary.account);
                console.log({table_name, owner, symcode, contract, account});
            }
        }
    });

    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();