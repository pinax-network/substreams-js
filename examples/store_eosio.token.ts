import { Substreams, download } from "../dist";
import { decodeBalance, decodeStat } from "./abi/eosio.token";
import { DatabaseOperation } from "./interfaces";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "https://eos.mypinata.cloud/ipfs/QmSS4cYiaEHUjd2KddJo6xdmXjfVnq6iJJuKAUz26NhDmL";
const outputModules = ["store_accounts", "store_stat"];
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
    const DatabaseOperation = registry.findMessage("antelope.common.v1.DatabaseOperation");
    if ( !DatabaseOperation) throw new Error("Could not find DatabaseOperation message type");

    substreams.on("storeDeltas", output => { 
        for ( const { key, newValue } of output.data.storeDeltas.deltas ) {
            const dbOp: DatabaseOperation = DatabaseOperation.fromBinary( newValue ) as any;
            if ( dbOp.code != "eosio.token") continue;
            if ( dbOp.tableName === "accounts") {
                const balance = decodeBalance(dbOp);
                if ( !balance ) continue;
                console.log({owner: dbOp.scope, balance});
            }
            if ( dbOp.tableName === "stat") {
                const supply = decodeStat(dbOp);
                if ( !supply ) continue;
                console.log({contract: dbOp.code, supply});
            }
        }
    });

    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();