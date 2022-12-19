import Substreams from "..";

// configs
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmXhHkjuqCFvxEaYDrcURZMhD7y9RNSfNWmXHtX8ramEHL";
const proto = "QmWthaEr1Zde3g7CdoWpPqL4fCvptHZHFq4evBNoWppotP";
const outputModules = ["map_transfers"];
const startBlockNum = "283000000";
const stopBlockNum = "283001000";

// init
const substreams = new Substreams(host, {
    startBlockNum,
    stopBlockNum,
    outputModules,
});

// handle stream events
(async () => {
    // download Substream from IPFS
    const modules = await Substreams.downloadSubstream(substream);

    // download protobuf from IPFS
    const root = await Substreams.downloadProto(proto);

    substreams.on("block", block => {
        console.log("Stream Block", block);
    });
    
    substreams.on("mapOutput", value => {
        console.log("Stream Map Output", value);
    });

    await substreams.start(modules);
    console.log("done");
})();
