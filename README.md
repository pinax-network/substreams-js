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
const host = "<FIREHOSE HOST>";
const substream = "https://ipfs.pinax.network/ipfs/QmfE7kdRAPihhvij4ej3rUM2Sp3PcXQ9rTFCQPhPGB5dr5";
const outputModules = ["map_action_traces"];
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

    // Find Protobuf message types from registry
    const ActionTraces = registry.findMessage("sf.antelope.type.v1.ActionTraces");
    if ( !ActionTraces) throw new Error("Could not find ActionTraces message type");

    substreams.on("mapOutput", output => {
        const { actionTraces } = ActionTraces.fromBinary(output.data.mapOutput.value);
        for ( const actionTrace of actionTraces ) {
            console.log(actionTrace);
        }
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
