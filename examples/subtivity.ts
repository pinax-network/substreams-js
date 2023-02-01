import { Substreams, download } from "../src";

// User input
const spkg = "https://github.com/pinax-network/subtivity-substreams/releases/download/v0.1.0/subtivity-ethereum-v0.1.0.spkg";
const outputModule = "map_block_stats";
const startBlockNum = "300000";
const stopBlockNum = "+10";

// Initialize Substreams
const substreams = new Substreams(outputModule, {
    startBlockNum,
    stopBlockNum,
    authorization: process.env.STREAMINGFAST_KEY
});

(async () => {
    // download Substream from IPFS
    const {modules, registry} = await download(spkg);

    // Find Protobuf message types from registry
    const BlockStats = registry.findMessage("subtivity.v1.BlockStats");
    if ( !BlockStats) throw new Error("Could not find BlockStats message type");

    substreams.on("mapOutput", output => {
        const decoded = BlockStats.fromBinary(output.data.mapOutput.value);
        console.log(decoded);
    });

    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();