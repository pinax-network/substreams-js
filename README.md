# Node.js `Substream` Consumer

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/EOS-Nation/substreams-nodejs-consumer/blob/main/LICENSE)
[![Node.js Substreams](https://github.com/EOS-Nation/substreams-nodejs-consumer/actions/workflows/node-consumer.yml/badge.svg)](https://github.com/EOS-Nation/substreams-nodejs-consumer/actions/workflows/node-consumer.yml)

> General purpose Substream SDK library

## Requirements

- [Node.js (LTS or Current)](https://nodejs.org/en/)
- [Buf - Protocol Buffers](https://buf.build/)
- [Antelope Firehose V2](https://eos.firehose.eosnation.io)
  > `eos.firehose.eosnation.io:9001` by default

## Environment Variables

```env
# Required
PACKAGE=QmXhHkjuqCFvxEaYDrcURZMhD7y9RNSfNWmXHtX8ramEHL
PROTO=QmWthaEr1Zde3g7CdoWpPqL4fCvptHZHFq4evBNoWppotP
MODULES=map_transfers
START_BLOCK_NUM=283000000
STOP_BLOCK_NUM=283001000

# (Optional)
FIREHOSE_HOST=eos.firehose.eosnation.io:9001
API_TOKEN=""
```

## Quickstart

```js
import fs from "fs";
import * as substreams from "substreams-node";

// Initialize Process (write to JSONL file)
let writer;
function init(startBlock, stopBlock) {
    writer = fs.createWriteStream(`tokens_${startBlock}-${stopBlock}.jsonl`);
}

// Process Block Data
function processBlock(response) {
    const block = substreams.parseBlockData(response);
    if (!block) return;
    substreams.printBlock(block.clock);

    for ( const output of block.outputs ) {
        writer.write(JSON.stringify(output) + "\n");
    }
}

// Substream completed
function done() {
    writer.end();
}

// Run Substream process
(async () => {
    await substreams.run({init, processBlock, done});
    process.exit();
})();
```

## Tests

```bash
$ npm ci
$ npm test
```