import { Substreams, download } from "../dist";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmU2nMULy6ChWbypNfG5Hde8h9fevcdX2ZtGtwGkkACJ7Z";
const outputModules = ["map_transfers"];
const startBlockNum = "285135425";
const stopBlockNum = "285136425";

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
    const Actions = registry.findMessage("antelope.actions.v1.Actions");
    if ( !Actions) throw new Error("Could not find Actions message type");
    
    let count = 0;
    substreams.on("mapOutput", output => {
        if ( output.name == "map_transfers" ) {
            const action = Actions.fromBinary(output.data.mapOutput.value);
            console.log("Map Output:", action);
            count++;
        } else {
            console.log(output);
        }
    });
    await substreams.start(modules);
    console.log("done", {count});
    process.exit();
})();

// 41164