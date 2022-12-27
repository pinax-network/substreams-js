import { Substreams, download } from "../";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmUHhFUSwubGKGTY3MQobnm9sHgYnTpY8yeEx3JUxYjSX1";
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
    const {modules} = await download(substream);
    
    substreams.on("block", output => {
        console.log(output);
    });

    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();