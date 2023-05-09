import { Substreams, download, PrometheusOperations } from "../src";

// User input
const url = "QmTMejWjo44yxSD7Vzbtcmo6GfgV5d3Y4z85SkRp9VC3b7"
const outputModule = "map_transfers";
const param = "to=swap.defi&symcode=EOS";
const params = {[outputModule]: param};
const startBlockNum = "300000000";
const stopBlockNum = "+1000";
const host = 'https://eos.firehose.eosnation.io:9001';
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

    substreams.on("anyMessage", (messages: any) => {
        for ( const message of messages.items ) {
            console.log(message);
        }
    });
    substreams.param(param);
    substreams.params(params);
    substreams.start();
})();