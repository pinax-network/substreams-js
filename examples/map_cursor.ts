import { Substreams, download } from "../";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "https://eos.mypinata.cloud/ipfs/Qmdf7GT6jaT9NB3XPLvss8YxuHiSAC1PP1xm9UqLbuouYT";
const outputModules = ["map_action_traces"];
const startBlockNum = "2";
const stopBlockNum = "1000";
const startCursor = "DVJPAHvHlTWH9Gpr1jOJxqWwLpc_DFtrUwHlKhFBhYv_8iHBjJX3Amhyb0uEkqGh2xboHVqsiIvIEHd7p5FUtNa4w75m5CE7RnJ5xY7o_LfuefKhOVtPJ-hkVeuKZNLbWzzXYgryeOIEsd22OPreYBRmYM93KmWw2T9Q9NFRdKoR7CIxyzuvc8nQ2fuV8YsUqeUjQ-eglCrwB2Qpehxc";

// Initialize Substreams
const substreams = new Substreams(host, {
    startBlockNum,
    stopBlockNum,
    startCursor,
    outputModules,
});

(async () => {
    // download Substream from IPFS
    const {modules} = await download(substream);
    
    // keep track of cursor
    substreams.on("cursor", cursor => {
        console.log({cursor});
    });
    
    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();