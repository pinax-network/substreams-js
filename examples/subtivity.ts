import { Substreams, download } from "../src";

// User input
const url = "https://github.com/pinax-network/subtivity-substreams/releases/download/v0.2.0/subtivity-ethereum-v0.2.0.spkg";
const outputModule = "map_block_stats";
const startBlockNum = "300000";
const stopBlockNum = "+10";
const host = 'https://mainnet.eth.streamingfast.io:443';
const authorization = process.env.SUBSTREAMS_API_TOKEN;

(async () => {
    const spkg = await download(url);
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
    substreams.on("anyMessage", (message, clock) => {
        console.log({message, clock});
    });
    substreams.start();
})();