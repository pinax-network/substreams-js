import { credentials, Metadata } from '@grpc/grpc-js';
import { GrpcTransport } from '@protobuf-ts/grpc-transport';

// Substream generated code
// $ buf generate buf.build/fubhy/substreams
import { StreamClient } from './src/generated/sf/substreams/v1/substreams.client';
import { Package } from './src/generated/sf/substreams/v1/package';
import { Modules } from './src/generated/sf/substreams/v1/modules';
import { BlockScopedData, ForkStep, Request } from './src/generated/sf/substreams/v1/substreams';

// Export utils & Typescript interfaces
export * from "./src/generated/sf/substreams/v1/clock"
export * from "./src/generated/sf/substreams/v1/modules"
export * from "./src/generated/sf/substreams/v1/package"
export * from "./src/generated/sf/substreams/v1/substreams"
export * from "./src/utils";

// Environment variables
import { API_TOKEN, FIREHOSE_HOST, START_BLOCK_NUM, STOP_BLOCK_NUM, MODULES, PACKAGE, PROTO } from './src/config';

// Utils
import { downloadPackage, downloadProto, parseBlockData } from './src/utils';

// Credentials
const metadata = new Metadata();
if ( API_TOKEN ) metadata.add('authorization', API_TOKEN);
const creds = credentials.combineChannelCredentials(
    credentials.createSsl(),
    credentials.createFromMetadataGenerator((_, callback) => callback(null, metadata)),
);

// Create Substream Client
const client = new StreamClient(
    new GrpcTransport({
        host: FIREHOSE_HOST,
        channelCredentials: creds,
    }),
);

// Load Substream
export function createStream(modules?: Modules) {
    return client.blocks(Request.create({
        startBlockNum: START_BLOCK_NUM,
        stopBlockNum: STOP_BLOCK_NUM,
        forkSteps: [ForkStep.STEP_IRREVERSIBLE],
        modules,
        outputModules: MODULES,
    }));
}

export type Adapter = {
    init(startBlockNum?: string, stopBlockNum?: string): any;
    processBlock(block: BlockScopedData): any;
    processMapOutput(value: Uint8Array, root: protobuf.Root): any;
    done(): any;
}

export type Config = {
    START_BLOCK_NUM?: string;
    STOP_BLOCK_NUM?: string;
}

async function downloadSubstream( ipfs: string ) {
    const binary = await downloadPackage(ipfs);
    const { modules } = Package.fromBinary(binary);
    if ( !modules ) throw new Error(`No modules found in Substream: ${ipfs}`);
    return modules;
}

// Parse Substream Block Data
export async function run(adapter: Adapter, config: Config = {}) {

    // Setup Substream
    const modules = await downloadSubstream(PACKAGE);
    const root = await downloadProto(PROTO);
    const stream = createStream(modules);

    // Send Substream Data to Adapter
    await adapter.init(START_BLOCK_NUM, STOP_BLOCK_NUM);
    for await (const response of stream.responses) {
        const block = parseBlockData(response);
        if ( !block ) continue;
        adapter.processBlock(block);

        for ( const output of block.outputs ) {
            if ( output.data.oneofKind == "mapOutput" ) {
                const { value } = output.data.mapOutput;
                if ( !value.length ) continue;
                adapter.processMapOutput( value, root );
            }
        }
    }
    await adapter.done();
}
