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
import { BlockScopedData, ForkStep, Request, ModuleOutput, StoreDeltas } from './generated/sf/substreams/v1/substreams_pb.js';

// Export generated substreams protobufs
export * from "./generated/sf/substreams/v1/clock_pb.js";
export * from "./generated/sf/substreams/v1/modules_pb.js";
export * from "./generated/sf/substreams/v1/package_pb.js";
export * from "./generated/sf/substreams/v1/substreams_pb.js";
export * from "./generated/sf/substreams/v1/substreams_connect.js";

// Export generated sink protobufs
export { EntityChanges, EntityChange, EntityChange_Operation } from "./generated/sf/substreams/sink/entity/v1/entity_pb.js"
export { DatabaseChanges, TableChange, TableChange_Operation } from "./generated/sf/substreams/sink/database/v1/database_pb.js"
export { KVOperations, KVOperation, KVOperation_Type } from "./generated/sf/substreams/sink/kv/v1/kv_pb.js"
export { PrometheusOperations, PrometheusOperation, GaugeOp, GaugeOp_Operation } from "./generated/pinax/substreams/sink/prometheus/v1/prometheus_pb.js"
export { LoggerOperations, LoggerOperation, LoggingLevels } from "./generated/pinax/substreams/sink/winston/v1/winston_pb.js"

// Export utils
export * from "./utils.js";
export * from "./authorization.js";

// Utils
import { parseBlockData, parseStopBlock, unpack, isNode, calculateHeadBlockTimeDrift, decode, timeout, getTypeName } from './utils.js';
import { Clock } from './generated/sf/substreams/v1/clock_pb.js';
import * as ipfs from "./ipfs";
export { ipfs };

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
export const DEFAULT_IPFS = "https://ipfs.pinax.network/ipfs/";

type MessageEvents = {
    block: (block: BlockScopedData) => void;
    clock: (clock: Clock) => void;
    mapOutput: (output: MapOutput, clock: Clock) => void;
    anyMessage: (message: any, clock: Clock, typeName: string) => void;
    debugStoreDeltas: (output: StoreDelta, clock: Clock) => void;
    cursor: (cursor: string, clock: Clock) => void;
    start: (cursor: string, clock: Clock) => void;
    end: (cursor: string, clock: Clock) => void;
    head_block_time_drift: (seconds: number, clock: Clock) => void;
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

    public async start(delaySeconds?: number|string) {
        this.stopped = false;
        if ( delaySeconds ) await timeout(Number(delaySeconds) * 1000);

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
            this.emit("head_block_time_drift", calculateHeadBlockTimeDrift(clock), clock);
    
            for ( const output of block.outputs ) {
                if ( output.data.case === "mapOutput" ) {
                    // emit raw mapOutput
                    const { value } = output.data.value;
                    if ( !value.length ) continue;
                    this.emit("mapOutput", output as any, clock);

                    // emit decoded mapOutput
                    const typeName = getTypeName(output);
                    const decoded = decode(output, this.registry, typeName);
                    if (!decoded) continue;
                    this.emit("anyMessage", decoded, clock, typeName);
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
