const { Substreams, download } = require("substreams");

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "https://eos.mypinata.cloud/ipfs/Qmdf7GT6jaT9NB3XPLvss8YxuHiSAC1PP1xm9UqLbuouYT";
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