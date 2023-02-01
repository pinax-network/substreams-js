# `Substreams` **Javascript** consumer

[![Build Status](https://github.com/pinax-network/substreams-js/actions/workflows/test.yml/badge.svg)](https://github.com/pinax-network/substreams-js/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/substreams.svg)](https://badge.fury.io/js/substreams)
![License](https://img.shields.io/github/license/pinax-network/substreams-js)
[![Try substreams on RunKit](https://badge.runkitcdn.com/substreams.svg)](https://npm.runkit.com/substreams)
> `Substream` **Javascript** consumer library using [**Node.js** Event emitters](https://nodejs.dev/en/learn/the-nodejs-event-emitter/).

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

## Endpoints

- https://github.com/pinax-network/endpoints

## Quickstart

```js
const { Substreams, download } = require("substreams");

// User input
const spkg = "https://github.com/pinax-network/subtivity-substreams/releases/download/v0.1.0/subtivity-ethereum-v0.1.0.spkg";
const outputModule = "map_block_stats";
const startBlockNum = "300000";
const stopBlockNum = "+10";

// Initialize Substreams
const substreams = new Substreams(outputModule, {
    startBlockNum,
    stopBlockNum,
    authorization: process.env.STREAMINGFAST_KEY // or SUBSTREAMS_API_TOKEN
});

(async () => {
    // download Substream from IPFS
    const {modules, registry} = await download(spkg);

    // Find Protobuf message types from registry
    const BlockStats = registry.findMessage("subtivity.v1.BlockStats");
    if ( !BlockStats) throw new Error("Could not find BlockStats message type");

    substreams.on("mapOutput", output => {
        const decoded = BlockStats.fromBinary(output.data.mapOutput.value);
        console.log(decoded);
    });

    // start streaming Substream
    await substreams.start(modules);

    // end of Substream
    console.log("done");
    process.exit();
})();
```

## Tests

```bash
$ npm ci
$ npm test
```
