import { Substreams, download } from "../";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmXhHkjuqCFvxEaYDrcURZMhD7y9RNSfNWmXHtX8ramEHL";
const outputModules = ["map_transfers"];
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
    const Actions = registry.findMessage("antelope.eosio.token.v1.Actions");
    if ( !Actions) throw new Error("Could not find Actions message type");

    substreams.on("mapOutput", output => {
        if ( output.name == "map_transfers" ) {
            const action = Actions.fromBinary(output.data.mapOutput.value);
            console.log("Map Output:", action);
        }
    });
    
    substreams.on("block", block => {
        console.log("Block:", block);
    });
    substreams.on("storeDeltas", output => {
        console.log("Store Deltas:", output);
    });

    await substreams.start(modules);
    console.log("done");
    process.exit();
})();
