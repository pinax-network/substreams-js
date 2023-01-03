import { Substreams, download } from "../dist";
import { decodeAccount } from "./abi/eosio.token";
import { CurrencyStats } from "./interfaces";
import { Name, Asset } from "@greymass/eosio";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "https://eos.mypinata.cloud/ipfs/QmbttxBK9FbV8E8g8g8jp8rpYDvK8QzEwSx4bQmafngXpJ";
const outputModules = ["store_stat"];
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
    const CurrencyStats = registry.findMessage("antelope.eosio.token.v1.CurrencyStats");
    if ( !CurrencyStats) throw new Error("Could not find CurrencyStats message type");

    substreams.on("storeDeltas", output => { 
        for ( const { key, newValue } of output.data.storeDeltas.deltas ) {
            if ( output.name == "store_stat") {
                let [table_name, contract, symcode] = key.split(":");
                symcode = Asset.SymbolCode.from(Name.from(symcode).value).toString();
                const binary: CurrencyStats = CurrencyStats.fromBinary( newValue ) as any;
                const currencyStats = decodeAccount(binary.currencyStats);
                console.log({table_name, contract, symcode, currencyStats});
            }
        }
    });

    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();