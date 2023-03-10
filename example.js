const { Substreams, download } = require("./");

// User input
const spkg = "https://github.com/pinax-network/subtivity-substreams/releases/download/v0.2.0/subtivity-ethereum-v0.2.0.spkg";
const outputModule = "map_block_stats";
const startBlockNum = "300000";
const stopBlockNum = "+10";

// Initialize Substreams
const substreams = new Substreams(outputModule, {
    startBlockNum,
    stopBlockNum,
    authorization: process.env.SUBSTREAMS_API_TOKEN
});

(async () => {
    // download Substream from IPFS
    const {modules, registry} = await download(spkg);

    // Find Protobuf message types from registry
    const BlockStats = registry.findMessage("subtivity.v1.BlockStats");
    if ( !BlockStats) throw new Error("Could not find BlockStats message type");

    // first block received
    substreams.on("start", (cursor, clock) => {
        console.log({status: "start", cursor, clock});
    });

    // on every map output received
    substreams.on("mapOutput", (output, clock) => {
        const decoded = BlockStats.fromBinary(output.data.mapOutput.value);
        console.log({decoded, clock});
    });

    // end of stream
    substreams.on("end", (cursor, clock) => {
        console.log({status: "end", cursor, clock});
    });

    // start streaming Substream
    substreams.start(modules);
})();