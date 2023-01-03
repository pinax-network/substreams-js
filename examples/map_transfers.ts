import { Substreams, download } from "../";
import { TransferEvent } from "./interfaces";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "https://eos.mypinata.cloud/ipfs/QmTCrw4ihEUVLZEYaYqSAoXerR6wmddfF9Q8KQULonD5xM";
const outputModules = ["map_transfers"];
const startBlockNum = "2";
const stopBlockNum = "300";

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
    const TransferEvents = registry.findMessage("antelope.eosio.token.v1.TransferEvents");
    if ( !TransferEvents) throw new Error("Could not find TransferEvents message type");

    substreams.on("mapOutput", output => {
        const { items } = TransferEvents.fromBinary(output.data.mapOutput.value);
        for ( const item of items as TransferEvent[]) {
            console.log(item);
        }
    });

    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();