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
const { Substreams, download, unpack } = require("substreams");

// User parameters
const url = "https://github.com/pinax-network/subtivity-substreams/releases/download/v0.2.0/subtivity-ethereum-v0.2.0.spkg";
const outputModule = "map_block_stats";
const startBlockNum = "300000";
const stopBlockNum = "+10";

(async () => {
    // download Substream from IPFS
    const spkg = await download(url);
    
    // Initialize Substreams
    const substreams = new Substreams(spkg, outputModule, {
        startBlockNum,
        stopBlockNum,
        authorization: process.env.SUBSTREAMS_API_TOKEN
    });
    
    // Find Protobuf message types from registry
    const { registry } = unpack(spkg);
    const BlockStats = registry.findMessage("subtivity.v1.BlockStats");
    if ( !BlockStats) throw new Error("Could not find BlockStats message type");

    // first block received
    substreams.on("start", (cursor, clock) => {
        console.log({status: "start", cursor, clock});
    });

    // on every map output received
    substreams.on("mapOutput", (output, clock) => {
        const decoded = BlockStats.fromBinary(output.data.value.value);
        console.log({decoded, clock});
    });

    // end of stream
    substreams.on("end", (cursor, clock) => {
        console.log({status: "end", cursor, clock});
    });

    // start streaming Substream
    substreams.start();
})();
```

## Tests

```bash
$ npm ci
$ npm test
```
