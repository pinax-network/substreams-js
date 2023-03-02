import EventEmitter from 'node:events';
import TypedEmitter from "typed-emitter";
import { credentials, Metadata } from '@grpc/grpc-js';
import { GrpcTransport } from '@protobuf-ts/grpc-transport';
import { Any } from "@bufbuild/protobuf"

// Substream generated code
// buf generate buf.build/streamingfast/substreams:develop
import { StreamClient } from './generated/sf/substreams/v1/substreams.client.js';
import { Modules } from './generated/sf/substreams/v1/modules.js';
import { BlockScopedData, ForkStep, Request, ModuleOutput, StoreDeltas } from './generated/sf/substreams/v1/substreams.js';

// Export utils & Typescript interfaces
export * from "./generated/sf/substreams/v1/clock.js";
export * from "./generated/sf/substreams/v1/modules.js";
export * from "./generated/sf/substreams/v1/package.js";
export * from "./generated/sf/substreams/v1/substreams.client.js";
export * from "./generated/sf/substreams/v1/substreams.js";
export * from "./utils";

// Utils
import { parseAuthorization, parseBlockData, parseStopBlock } from './utils';
import { Clock } from './generated/sf/substreams/v1/clock.js';

interface MapOutput extends ModuleOutput {
    data: {
        oneofKind: "mapOutput";
        mapOutput: Any;
    }
}

interface StoreDelta extends ModuleOutput {
    data: {
        oneofKind: "debugStoreDeltas";
        debugStoreDeltas: StoreDeltas;
    }
}

type MessageEvents = {
    block: (block: BlockScopedData) => void;
    clock: (clock: Clock) => void;
    mapOutput: (output: MapOutput, clock: Clock) => void;
    debugStoreDeltas: (output: StoreDelta, clock: Clock) => void;
    cursor: (cursor: string, clock: Clock) => void;
    start: (cursor: string, clock: Clock) => void;
    end: (cursor: string, clock: Clock) => void;
}

export class Substreams extends (EventEmitter as new () => TypedEmitter<MessageEvents>) {
    // internal
    public client: StreamClient;

    // configs
    public host = "mainnet.eth.streamingfast.io:443";
    public startBlockNum?: string;
    public stopBlockNum?: string;
    public outputModule?: string;
    public cursor?: string;
    public startCursor?: string;
    public irreversibilityCondition?: string;
    public forkSteps?: ForkStep[];
    public initialStoreSnapshotForModules?: string[];
    public debugInitialStoreSnapshotForModules?: string[];
    public productionMode = false;

    private stopped = false;

    constructor(outputModule: string, options: {
        host?: string,
        startBlockNum?: string,
        stopBlockNum?: string,
        authorization?: string,
        startCursor?: string,
        forkSteps?: ForkStep[],
        irreversibilityCondition?: string;
        productionMode?: boolean;
        initialStoreSnapshotForModules?: string[],
        debugInitialStoreSnapshotForModules?: string[],
    } = {}) {
        super();
        this.outputModule = outputModule;
        this.startBlockNum = options.startBlockNum ?? "0";
        this.stopBlockNum = parseStopBlock(this.startBlockNum, options.stopBlockNum);
        this.startCursor = options.startCursor;
        this.irreversibilityCondition = options.irreversibilityCondition;
        this.forkSteps = options.forkSteps;
        this.initialStoreSnapshotForModules = options.initialStoreSnapshotForModules;
        this.debugInitialStoreSnapshotForModules = options.debugInitialStoreSnapshotForModules;
        this.productionMode = options.productionMode ?? false;
        this.host = options.host ?? "mainnet.eth.streamingfast.io:443";

        // Credentials
        const metadata = new Metadata();
        if ( options.authorization ) parseAuthorization(options.authorization).then( token => {
            metadata.add('authorization', token);
        })
        const creds = credentials.combineChannelCredentials(
            credentials.createSsl(),
            credentials.createFromMetadataGenerator((_, callback) => callback(null, metadata)),
        );
        
        // Substream Client
        this.client = new StreamClient(
            new GrpcTransport({
                host: this.host,
                channelCredentials: creds,
            }),
        );
    }

    public stop() {
        this.stopped = true;
    }

    public async start(modules: Modules) {    
        this.stopped = false;

        // Validate input
        if ( this.startBlockNum ) {
            const startBlockNum = Number(this.startBlockNum);
            if ( !Number.isInteger(startBlockNum)) throw new Error("startBlockNum must be an integer");
        }

        // Setup Substream
        const stream = this.client.blocks(Request.create({
            modules,
            ...this,
        }));
    
        // Send Substream Data to Adapter
        let last_cursor: string = '';
        let last_clock = {} as Clock;
        for await (const response of stream.responses) {
            if ( this.stopped ) break;
            const block = parseBlockData(response);
            if ( !block ) continue;
            if ( !block.clock ) continue;
            const clock: Clock = block.clock;
            if ( !last_cursor ) this.emit("start", block.cursor, clock);
            this.emit("block", block);
            this.emit("clock", clock);
    
            for ( const output of block.outputs ) {
                if ( output.data.oneofKind == "mapOutput" ) {
                    const { value } = output.data.mapOutput;
                    if ( !value.length ) continue;
                    this.emit("mapOutput", output as MapOutput, clock);
                }

                else if ( output.data.oneofKind == "debugStoreDeltas" ) {
                    const { deltas } = output.data.debugStoreDeltas;
                    if ( !deltas.length ) continue;
                    this.emit("debugStoreDeltas", output as StoreDelta, clock);
                }
            }
            this.emit("cursor", block.cursor, clock);
            last_cursor = block.cursor;
            last_clock = clock;
        }
        this.emit("end", last_cursor, last_clock);
    }
}
