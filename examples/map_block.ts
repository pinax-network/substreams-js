import { Substreams, download } from "../dist";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmUc8qGvJ8rVsTQV6L2pvZEEwpfw3K6LxcxX9FMvF4cPB4";
const outputModules = ["map_db_ops"];
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