# `Substreams` **Node.js** consumer

[![Build Status](https://github.com/EOS-Nation/substreams-nodejs/actions/workflows/test.yml/badge.svg)](https://github.com/EOS-Nation/substreams-nodejs/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/substreams-nodejs.svg)](https://badge.fury.io/js/substreams-nodejs)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/EOS-Nation/substreams-nodejs/master/LICENSE)

> `Substream` consumer library using native **Node.js** event emitters.

## Requirements

- [Node.js (LTS or Current)](https://nodejs.org/en/)
- [Buf - Protocol Buffers](https://buf.build/)
- [Firehose V2](https://eos.firehose.eosnation.io)

### Firsehose V2

| Chain       | Host     |
|-------------|----------|
| EOS         | `eos.firehose.eosnation.io:9001`
| WAX         | `wax.firehose.eosnation.io:9001`
| Ore         | `ore.firehose.eosnation.io:9001`
| Telos       | `telos.firehose.eosnation.io:9001`

### Firsehose V2 (Testnets)

| Chain         | Host     |
|---------------|----------|
| WAX Testnet   | `waxtest.firehose.eosnation.io:9001`
| Jungle 4      | `jungle4.firehose.eosnation.io:9001`
| Kylin         | `kylin.firehose.eosnation.io:9001`
| Ore Stage     | `orestage.firehose.eosnation.io:9001`
| Telos Testnet | `telostest.firehose.eosnation.io:9001`

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
    process.exit();
})();
```

## Tests

```bash
$ npm ci
$ npm test
```