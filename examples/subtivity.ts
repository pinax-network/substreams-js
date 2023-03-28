import { Substreams, download, PrometheusOperations } from "../src";

// User input
const url = "QmcswTuvTaDAwLVXYMC3g9TPXTDcWmhUDHpUd9cK8mdgs3";
const outputModule = "prom_out";
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

    substreams.on("anyMessage", (message: PrometheusOperations) => {
        for ( const operation of message.operations ) {
            console.log(operation.toJson());
        }
    });

    substreams.start();
})();