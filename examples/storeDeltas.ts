import { Substreams, download } from "../";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmU2nMULy6ChWbypNfG5Hde8h9fevcdX2ZtGtwGkkACJ7Z";
const outputModules = ["store_transfers_amount"];
const startBlockNum = "2";
const stopBlockNum = "1000";

// Initialize Substreams
const substreams = new Substreams(host, {
    startBlockNum,
    stopBlockNum,
    outputModules,
});

(async () => {
    // download Substream from IPFS
    const {modules, registry} = await download(substream);
    
    // Find Protobuf message types
    const Actions = registry.findMessage("antelope.actions.v1.Actions");
    if ( !Actions) throw new Error("Could not find Actions message type");

    substreams.on("storeDeltas", output => {
        for ( const delta of output.data.storeDeltas.deltas ) {
            const keys = new Map(delta.key.split(",").map(i => i.split("=") as [string, string]))
            const { account, symcode, from, to } = Object.fromEntries(keys);
            const value = Buffer.from(delta.newValue).toString();
            console.log("Store Delta:", {account, symcode, to, from, value});
        }
    });

    await substreams.start(modules);
    console.log("done");
    process.exit();
})();

// 41164