const { Substreams, download } = require("./");

// User parameters
const url = "https://github.com/streamingfast/substreams-ethereum-quickstart/releases/download/1.0.0/substreams-ethereum-quickstart-v1.0.0.spkg";
const outputModule = "map_block";
const startBlockNum = "12292922";
const stopBlockNum = "+10";

(async () => {
    // download Substream from IPFS
    const spkg = await download(url);

    // Initialize Substreams
    const substreams = new Substreams(spkg, outputModule, {
        startBlockNum,
        stopBlockNum,
        authorization: process.env.SUBSTREAMS_API_TOKEN
    });

    // first block received
    substreams.on("start", (cursor, clock) => {
        console.log({status: "start", cursor, clock});
    });

    // stream of decoded MapOutputs
    substreams.on("anyMessage", (message, clock, typeName) => {
        console.log({message, clock, typeName});
    });

    // end of stream
    substreams.on("end", (cursor, clock) => {
        console.log({status: "end", cursor, clock});
    });

    // start streaming Substream
    substreams.start();
})();