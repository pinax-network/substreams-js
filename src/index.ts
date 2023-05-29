import EventEmitter from 'node:events';
import TypedEmitter from "typed-emitter";
import { CallOptions, createPromiseClient, Transport } from "@bufbuild/connect";
import { createGrpcTransport } from "@bufbuild/connect-node";
import { createConnectTransport } from "@bufbuild/connect-web";

// import { Any } from "@bufbuild/protobuf"

// Substream generated code
// buf generate buf.build/streamingfast/substreams:develop
import { Stream } from './generated/sf/substreams/rpc/v2/service_connect.js';
import { Modules, Module_Input_Params } from './generated/sf/substreams/v1/modules_pb.js';
import { BlockScopedData, Request, MapModuleOutput, StoreModuleOutput, ModulesProgress, BlockUndoSignal } from './generated/sf/substreams/rpc/v2/service_pb.js';

// Export generated substreams protobufs
export * from "./generated/sf/substreams/v1/clock_pb.js";
export * from "./generated/sf/substreams/v1/modules_pb.js";
export * from "./generated/sf/substreams/v1/package_pb.js";
export * from "./generated/sf/substreams/rpc/v2/service_pb.js";
export * from "./generated/sf/substreams/rpc/v2/service_connect.js";

// Export generated sink protobufs
export { EntityChanges, EntityChange, EntityChange_Operation } from "./generated/sf/substreams/sink/entity/v1/entity_pb.js"
export { DatabaseChanges, TableChange, TableChange_Operation } from "./generated/sf/substreams/sink/database/v1/database_pb.js"
export { KVOperations, KVOperation, KVOperation_Type } from "./generated/sf/substreams/sink/kv/v1/kv_pb.js"
export { PrometheusOperations, PrometheusOperation, GaugeOp, GaugeOp_Operation } from "./generated/pinax/substreams/sink/prometheus/v1/prometheus_pb.js"

// Export utils
export * from "./utils.js";
export * from "./authorization.js";

// Utils
import { parseBlockData, parseStopBlock, parseModulesProgress, parseBlockUndoSignal, unpack, isNode, calculateHeadBlockTimeDrift, timeout } from './utils.js';
// V2 changes
import { decode, getTypeName } from './utils.js';

import { Clock } from './generated/sf/substreams/v1/clock_pb.js';
import * as ipfs from "./ipfs";
export { ipfs };

// types
import { IEnumTypeRegistry, IMessageTypeRegistry, IServiceTypeRegistry } from "@bufbuild/protobuf/dist/types/type-registry";
import { parseAuthorization } from './authorization';
export type Registry = IMessageTypeRegistry & IEnumTypeRegistry & IServiceTypeRegistry;

export const DEFAULT_HOST = "https://mainnet.eth.streamingfast.io:443";
export const DEFAULT_AUTH = "https://auth.streamingfast.io/v1/auth/issue";
export const DEFAULT_IPFS = "https://ipfs.pinax.network/ipfs/";

type MessageEvents = {
    block: (block: BlockScopedData) => void;
    progress: (progress: ModulesProgress) => void;
    undo: (undo: BlockUndoSignal) => void;
    clock: (clock: Clock) => void;
    anyMessage: (message: any, clock: Clock, typeName: string) => void;
    cursor: (cursor: string, clock: Clock) => void;
    start: (cursor: string, clock: Clock) => void;
    end: (cursor: string, clock: Clock) => void;
    head_block_time_drift: (seconds: number, clock: Clock) => void;

    // V2 new emitters
    output: (output: MapModuleOutput, clock: Clock) => void;
    debugStoreOutputs: (output: StoreModuleOutput[], clock: Clock) => void;
    debugMapOutputs: (output: MapModuleOutput[], clock: Clock) => void;
    finalBlockHeight: (block_height: bigint, clock: Clock) => void;

    // V2 deprecated
    // mapOutput: (output: MapModuleOutput, clock: Clock) => void;
    // debugStoreDeltas: (output: StoreDelta, clock: Clock) => void;
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
    public finalBlocksOnly?: boolean;
    public initialStoreSnapshotForModules?: string[];
    public debugInitialStoreSnapshotForModules?: string[];
    public productionMode = true;
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
        finalBlocksOnly?: boolean,
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
        this.finalBlocksOnly = options.finalBlocksOnly;
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
        if (isNode()) {
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
        if (this.startBlockNum) {
            const startBlockNum = Number(this.startBlockNum);
            if (!Number.isInteger(startBlockNum)) throw new Error("startBlockNum must be an integer");
        }
    }

    public stop() {
        this.stopped = true;
    }

    public param(value: string, moduleName?: string) {
        if (!moduleName) moduleName = this.outputModule;
        const module = this.modules.modules.find(m => m.name === moduleName);
        if (!module) throw new Error(`Module ${moduleName} not found`);
        const module_input = module.inputs.find(i => i.input.case === 'params');
        if (!module_input) throw new Error(`Module ${moduleName} does not have a params input`);
        module_input.input.value = new Module_Input_Params({ value });
    }

    public params(params: { [moduleName: string]: string }) {
        for (const [moduleName, value] of Object.entries(params)) {
            this.param(value, moduleName);
        }
    }

    public async start(delaySeconds?: number | string) {
        this.stopped = false;
        if (delaySeconds) await timeout(Number(delaySeconds) * 1000);

        const client = createPromiseClient(Stream, this.transport);

        const request = new Request({
            modules: this.modules,
            ...this as any,
        });

        // Authenticate API server key
        // no action if Substreams API token is provided
        if (this.authorization) {
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
        for await (const response of responses) {
            if (this.stopped) break;
            const block = parseBlockData(response);
            const progress = parseModulesProgress(response);
            const undo = parseBlockUndoSignal(response);

            // skip if block data if not present
            if (block && block.clock) {
                const { output, clock, finalBlockHeight } = block;

                if (!last_cursor) this.emit("start", block.cursor, clock);
                this.emit("block", block);
                this.emit("clock", clock);
                this.emit("head_block_time_drift", calculateHeadBlockTimeDrift(clock), clock);

                // Map Output
                if (output) {
                    this.emit("output", output, clock);
                    const typeName = getTypeName(output);
                    const decoded = decode(output, this.registry, typeName);
                    if (!decoded) continue;
                    this.emit("anyMessage", decoded, clock, typeName);
                }
                // Debug
                this.emit("debugStoreOutputs", block.debugStoreOutputs, clock);
                this.emit("debugMapOutputs", block.debugMapOutputs, clock);

                // Final
                this.emit("cursor", block.cursor, clock);
                this.emit("finalBlockHeight", finalBlockHeight, clock);
                last_cursor = block.cursor;
                last_clock = clock;
            } else if (progress) {
                this.emit("progress", progress);
            } else if (undo) {
                this.emit("undo", undo);
            }
        }
        this.emit("end", last_cursor, last_clock);
    }
}
