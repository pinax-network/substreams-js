# `Substreams` **Node.js** consumer

[![Build Status](https://github.com/EOS-Nation/substreams-nodejs/actions/workflows/test.yml/badge.svg)](https://github.com/EOS-Nation/substreams-nodejs/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/substreams.svg)](https://badge.fury.io/js/substreams)
![License](https://img.shields.io/github/license/EOS-Nation/substreams-nodejs)

> `Substream` consumer library using native **Node.js** event emitters.

## Install

Using NPM:

```bash
npm install --save substreams
```

or using Yarn:

```bash
yarn add substreams
```

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
import { Substreams, download } from "substreams";

// User input
const host = "eos.firehose.eosnation.io:9001";
const substream = "Qmd6br54LiYeG5wWgmo42eWe3mxjo5MgPpko2ziGxJztd4";
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
    const {modules, registry} = await download(substream);
    
    // Find Protobuf message types
    const Actions = registry.findMessage("antelope.actions.v1.Actions");
    if ( !Actions) throw new Error("Could not find Actions message type");

    substreams.on("mapOutput", output => {
        const action = Actions.fromBinary(output.data.mapOutput.value);
        console.log("Map Output:", action);
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
