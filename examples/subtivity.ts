import fs from "fs";
import { Substreams } from "../src";

// User input
const spkg = fs.readFileSync("subtivity-ethereum.spkg");
const outputModule = "map_block_stats";
const startBlockNum = "300000";
const stopBlockNum = "+1000";
const host = 'https://mainnet.eth.streamingfast.io:443';
const authorization = process.env.SUBSTREAMS_API_TOKEN;

(async () => {
    const substreams = new Substreams(spkg, outputModule, {
        host,
        startBlockNum,
        stopBlockNum,
        authorization,
        productionMode: true,
    });
    
    substreams.on("start", (cursor, clock) => {
        console.log({status: "start", cursor, clock});
    });
    substreams.on("mapOutput", (mapOutput, clock) => {
        console.log({mapOutput, clock});
    });
    substreams.start();
})();