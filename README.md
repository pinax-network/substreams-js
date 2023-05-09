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

// User parameters
const url = "https://github.com/streamingfast/substreams-ethereum-quickstart/releases/download/1.0.0/substreams-ethereum-quickstart-v1.0.0.spkg";
const outputModule = "map_block";
const startBlockNum = "12292922";
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

    // first block received
    substreams.on("start", (cursor, clock) => {
        console.log({status: "start", cursor, clock});
    });

    // stream of decoded MapOutputs
    substreams.on("anyMessage", (message) => {
        console.log({message});
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
