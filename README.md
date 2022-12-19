# `Substreams` **Node.js** Consumer

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/EOS-Nation/substreams-nodejs-consumer/blob/main/LICENSE)

[![Node.js Substreams](https://github.com/EOS-Nation/substreams-nodejs-consumer/actions/workflows/node-consumer.yml/badge.svg)](https://github.com/EOS-Nation/substreams-nodejs-consumer/actions/workflows/node-consumer.yml)

> `Substream` consumer library using native **Node.js** event emitters.

## Requirements

- [Node.js (LTS or Current)](https://nodejs.org/en/)
- [Buf - Protocol Buffers](https://buf.build/)
- [Antelope Firehose V2](https://eos.firehose.eosnation.io)
  > `eos.firehose.eosnation.io:9001` by default

## Quickstart

```js
import Substreams from "substreams";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "QmXhHkjuqCFvxEaYDrcURZMhD7y9RNSfNWmXHtX8ramEHL";
const proto = "QmWthaEr1Zde3g7CdoWpPqL4fCvptHZHFq4evBNoWppotP";
const outputModules = ["map_transfers"];
const startBlockNum = "283000000";
const stopBlockNum = "283001000";

// Initialize Substreams
const substreams = new Substreams(host, {
    startBlockNum,
    stopBlockNum,
    outputModules,
});

(async () => {
    // download Substream from IPFS
    const modules = await Substreams.downloadSubstream(substream);

    // download Protobuf from IPFS
    const root = await Substreams.downloadProto(proto);
    const Action = root.lookupType("Action");

    substreams.on("block", block => {
        console.log("Block:", block);
    });
    
    substreams.on("mapOutput", output => {
        if ( output.name == "map_transfers" ) {
            const action = Action.decode(output.data.mapOutput.value);
            console.log("Map Output:", action);
        }
    });

    substreams.on("storeDeltas", output => {
        console.log("Store Deltas:", output);
    });

    await substreams.start(modules);
    console.log("done");
})();
```

## Tests

```bash
$ npm ci
$ npm test
```