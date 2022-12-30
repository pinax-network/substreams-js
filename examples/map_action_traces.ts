import { Substreams, download } from "../";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "https://eos.mypinata.cloud/ipfs/Qma9W6pQDnm5V7nu5N9yLARNg2K9jn2gcySLRYfLj2d9Ec";
const outputModules = ["map_action_traces"];
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
    
    // Find Protobuf message types from registry
    const ActionTraces = registry.findMessage("antelope.common.v1.ActionTraces");
    if ( !ActionTraces) throw new Error("Could not find ActionTraces message type");

    substreams.on("mapOutput", output => {
        const { actionTraces } = ActionTraces.fromBinary(output.data.mapOutput.value);
        for ( const actionTrace of actionTraces ) {
            console.log(actionTrace);
        }
    });

    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();