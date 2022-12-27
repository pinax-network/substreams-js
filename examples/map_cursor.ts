import { Substreams, download, saveCursor, readCursor } from "../";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmUHhFUSwubGKGTY3MQobnm9sHgYnTpY8yeEx3JUxYjSX1";
const outputModules = ["map_action_traces"];
let lastCursor = readCursor(substream);
let count = 0;
const maxCount = 100;

// Initialize Substreams
const substreams = new Substreams(host, {
    startBlockNum: "2",
    startCursor: lastCursor,
    outputModules,
});

(async () => {
    // download Substream from IPFS
    const {modules} = await download(substream);
    
    // keep track of cursor
    substreams.on("cursor", cursor => {
        lastCursor = cursor;
        console.log({count, cursor});
        count++;

        // stop streaming Substream after maximum count
        if ( count > maxCount ) substreams.stop();  
    });
    
    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    saveCursor(substream, lastCursor);
    console.log("done");
    process.exit();
})();