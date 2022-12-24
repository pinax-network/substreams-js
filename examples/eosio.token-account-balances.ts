import { Substreams, download } from "../dist";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmU2nMULy6ChWbypNfG5Hde8h9fevcdX2ZtGtwGkkACJ7Z";
// const substream = "../substreams-antelope/substreams/eosio.token/eosio-token-v0.1.2.spkg"
const outputModules = ["map_account_balances"];
const startBlockNum = "283000000";
const stopBlockNum = "283001000";

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
    const DatabaseOperations = registry.findMessage("antelope.tables.v1.DatabaseOperations");
    if ( !DatabaseOperations) throw new Error("Could not find DatabaseOperations message type");

    substreams.on("mapOutput", output => {
        const action = DatabaseOperations.fromBinary(output.data.mapOutput.value);
        console.log("Map Output:", action);
    });

    await substreams.start(modules);
    console.log("done");
    process.exit();
})();