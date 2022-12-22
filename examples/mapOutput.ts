import { Substreams, download } from "../dist";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "Qmd6br54LiYeG5wWgmo42eWe3mxjo5MgPpko2ziGxJztd4";
const outputModules = ["map_transfers"];
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
    const Actions = registry.findMessage("antelope.actions.v1.Actions");
    if ( !Actions) throw new Error("Could not find Actions message type");

    substreams.on("mapOutput", output => {
        if ( output.name == "map_transfers" ) {
            const action = Actions.fromBinary(output.data.mapOutput.value);
            console.log("Map Output:", action);
        } else {
            console.log(output);
        }
    });

    await substreams.start(modules);
    console.log("done");
    process.exit();
})();

// 41164