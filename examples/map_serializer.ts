import fs from "node:fs";
import path from "node:path";
import { Substreams, download } from "../";
import { ABI, Serializer } from "@greymass/eosio"

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmUc8qGvJ8rVsTQV6L2pvZEEwpfw3K6LxcxX9FMvF4cPB4";
const outputModules = ["map_db_ops"];
const startBlockNum = "283000000";
const stopBlockNum = "283001000";

// Initialize Substreams
const substreams = new Substreams(host, {
    startBlockNum,
    stopBlockNum,
    outputModules,
});

const abi = ABI.from(
    JSON.parse(fs.readFileSync(path.join(__dirname, "abi", "eosio.token.abi"), "utf8")).abi
);

function decodeBalance(dbOp: any) {
    const { tableName, code, primaryKey } = dbOp;
    if ( dbOp.tableName !== "accounts") return null;
    const data = dbOp.oldData.toString("hex");
    try {
        const decoded: any = Serializer.decode({data, type: 'account', abi});
        return decoded.balance.toString();
    } catch (e: any) {
        console.error({error: e.message, tableName, code, primaryKey});
        return null;
    }
}

function decodeStat(dbOp: any) {
    const { tableName, code, primaryKey } = dbOp;
    if ( dbOp.tableName !== "stat") return null;
    const data = dbOp.oldData.toString("hex");
    try {
        const decoded: any = Serializer.decode({data, type: 'currency_stats', abi});
        return decoded.supply.toString();
    } catch (e: any) {
        console.error({error: e.message, tableName, code, primaryKey});
        return null;
    }
}

(async () => {
    // download Substream from IPFS
    const {modules, registry} = await download(substream);
    
    // Find Protobuf message types
    const DatabaseOperations = registry.findMessage("antelope.common.v1.DatabaseOperations");
    if ( !DatabaseOperations) throw new Error("Could not find DatabaseOperations message type");
    
    substreams.on("mapOutput", output => {
        const { dbOps } = DatabaseOperations.fromBinary(output.data.mapOutput.value);
        for ( const dbOp of dbOps ) {
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