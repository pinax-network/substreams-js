import { Substreams, download } from "../dist";
import { decodeAccount } from "./abi/eosio.token";
import { Account } from "./interfaces";
import { Name, Asset } from "@greymass/eosio";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "https://eos.mypinata.cloud/ipfs/QmX4tSoz8bgGA1j6SjMMbtzt4y8AP6x37XpVwYLUN6eHCh";
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
                const [owner, symcode_name, contract] = key.split(":");
                const symcode = Asset.SymbolCode.from(Name.from(symcode_name).value).toString();
                const binary: Account = Account.fromBinary( newValue ) as any;
                const account = decodeAccount(binary.balance);
                console.log({owner, symcode, contract, account});
            }
        }
    });

    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();