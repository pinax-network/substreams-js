import EventEmitter from 'node:events';
import TypedEmitter from "typed-emitter";
import { CallOptions, createPromiseClient, Transport } from "@bufbuild/connect";
import { createGrpcTransport } from "@bufbuild/connect-node";
import { createConnectTransport } from "@bufbuild/connect-web";

import { Any } from "@bufbuild/protobuf"

// Substream generated code
// buf generate buf.build/streamingfast/substreams:develop
import { Stream } from './generated/sf/substreams/v1/substreams_connect.js';
import { Modules } from './generated/sf/substreams/v1/modules_pb.js';
import { BlockScopedData, ForkStep, Request, ModuleOutput, StoreDeltas } from './generated/sf/substreams/v1/substreams_pb';

// Export utils & Typescript interfaces
export * from "./generated/sf/substreams/v1/clock_pb.js";
export * from "./generated/sf/substreams/v1/modules_pb.js";
export * from "./generated/sf/substreams/v1/package_pb.js";
export * from "./generated/sf/substreams/v1/substreams_pb.js";
export * from "./generated/sf/substreams/v1/substreams_connect.js";
export * from "./utils";
export * from "./authorization";

// Utils
import { parseBlockData, parseStopBlock, unpack, isNode } from './utils';
import { Clock } from './generated/sf/substreams/v1/clock_pb.js';

// types
import { IEnumTypeRegistry, IMessageTypeRegistry, IServiceTypeRegistry } from "@bufbuild/protobuf/dist/types/type-registry";
import { parseAuthorization } from './authorization';
export type Registry = IMessageTypeRegistry & IEnumTypeRegistry & IServiceTypeRegistry;

export interface MapOutput extends ModuleOutput {
    data: {
        case: "mapOutput"
        value: Any;
    }
}

export interface StoreDelta extends ModuleOutput {
    data: {
        case: "debugStoreDeltas"
        value: StoreDeltas;
    }
}

export const DEFAULT_HOST = "https://mainnet.eth.streamingfast.io:443";
export const DEFAULT_AUTH = "https://auth.streamingfast.io/v1/auth/issue";

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
    // configs
    public host = DEFAULT_HOST;
    public auth = DEFAULT_AUTH;
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
    public modules: Modules;
    public registry: Registry;
    public transport: Transport;
    public authorization = "";
    public callOptions?: CallOptions;

    private stopped = false;

    constructor(spkg: Uint8Array, outputModule: string, options: {
        host?: string,
        auth?: string,
        startBlockNum?: string,
        stopBlockNum?: string,
        authorization?: string,
        startCursor?: string,
        forkSteps?: ForkStep[],
        irreversibilityCondition?: string;
        productionMode?: boolean;
        initialStoreSnapshotForModules?: string[],
        debugInitialStoreSnapshotForModules?: string[],
        callOptions?: CallOptions,
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
        this.host = options.host ?? DEFAULT_HOST;
        this.auth = options.auth ?? DEFAULT_AUTH;
        this.authorization = options.authorization ?? "";
        this.callOptions = options.callOptions;
        
        // unpack spkg
        const { modules, registry } = unpack(spkg);
        this.modules = modules;
        this.registry = registry;

        // create transport
        if ( isNode() ) {
            this.transport = createGrpcTransport({
                baseUrl: this.host,
                httpVersion: "2",
            });
        } else {
            this.transport = createConnectTransport({
                baseUrl: this.host,
                useBinaryFormat: true,
                jsonOptions: {
                  typeRegistry: this.registry,
                },
            })
        }

        // Validate input
        if ( this.startBlockNum ) {
            const startBlockNum = Number(this.startBlockNum);
            if ( !Number.isInteger(startBlockNum)) throw new Error("startBlockNum must be an integer");
        }
    }

    public stop() {
        this.stopped = true;
    }

    public async start() {
        this.stopped = false;

        const client = createPromiseClient(Stream, this.transport);

        const request = new Request({
            modules: this.modules,
            ...this as any,
        });

        // Authenticate API server key
        // no action if Substreams API token is provided
        if ( this.authorization ) {
            this.authorization = await parseAuthorization(this.authorization, this.auth);
        }
        
        // Setup Substream
        const responses = await client.blocks(request, {
            headers: { Authorization: this.authorization },
            ...this.callOptions
        })

        // Send Substream Data to Adapter
        let last_cursor: string = '';
        let last_clock = {} as Clock;
        for await ( const response of responses ) {
            if ( this.stopped ) break;
            const block = parseBlockData(response);
            if ( !block ) continue;
            if ( !block.clock ) continue;
            const clock: Clock = block.clock;
            if ( !last_cursor ) this.emit("start", block.cursor, clock);
            this.emit("block", block);
            this.emit("clock", clock);
    
            for ( const output of block.outputs ) {
                if ( output.data.case === "mapOutput" ) {
                    const { value } = output.data.value;
                    if ( !value.length ) continue;
                    this.emit("mapOutput", output as any, clock);
                }

                else if ( output.data.case === "debugStoreDeltas" ) {
                    const { deltas } = output.data.value;
                    if ( !deltas.length ) continue;
                    this.emit("debugStoreDeltas", output as any, clock);
                }
            }
            this.emit("cursor", block.cursor, clock);
            last_cursor = block.cursor;
            last_clock = clock;
        }
        this.emit("end", last_cursor, last_clock);
    }
}
