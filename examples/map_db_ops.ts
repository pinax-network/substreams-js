import { Substreams, download } from "../";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "https://eos.mypinata.cloud/ipfs/Qmdf7GT6jaT9NB3XPLvss8YxuHiSAC1PP1xm9UqLbuouYT";
const outputModules = ["map_db_ops"];
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
    const DatabaseOperations = registry.findMessage("antelope.common.v1.DatabaseOperations");
    if ( !DatabaseOperations) throw new Error("Could not find DatabaseOperations message type");
    
    substreams.on("mapOutput", output => {
        const { dbOps } = DatabaseOperations.fromBinary(output.data.mapOutput.value);
        for ( const dbOp of dbOps ) {
            console.log(dbOp);
        }
    });
    
    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();