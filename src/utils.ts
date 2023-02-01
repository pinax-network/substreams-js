import makeFetch from 'fetch-ponyfill'
import { createRegistryFromDescriptors } from "@bufbuild/protobuf";

// Substream auto-generated
import { Package } from './generated/sf/substreams/v1/package';
import { Clock } from "./generated/sf/substreams/v1/clock";
import { BlockScopedData, Response } from "./generated/sf/substreams/v1/substreams";

export const fetch = makeFetch().fetch

export function printBlock( block: BlockScopedData, interval = 100 ) {
    const seconds = getSeconds(block.clock);
    const date = formatDate(seconds);
    const block_num = Number(block.clock?.number);
    if ( block_num % interval !== 0) return;
    console.log(`----------- NEW BLOCK #${block_num} (${date}) ---------------`);
}

export function formatDate( seconds: number ) {
    return new Date(seconds * 1000).toISOString().replace(".000Z", "")
}

export function parseBlockData( response: Response ) {
    if (response.message.oneofKind !== 'data') return;
    return (response.message as any).data as BlockScopedData;
}

export function getSeconds( clock?: Clock ) {
    return Number(clock?.timestamp?.seconds);
}

interface Token {
    token: string;
    expires_at: number;
}

export async function authentication_token(api_key: string) {
    const url = 'https://auth.streamingfast.io/v1/auth/issue';
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({api_key})
    })
    return response.json() as Promise<Token>;
}

export async function parseAuthorization(authorization: string ) {
    if ( authorization.includes("server_") ) {
        return (await authentication_token(authorization)).token;
    }
    return authorization;
}

export const isIpfs = ( str: string ) => /^Qm[1-9A-Za-z]{44}$/.test(str);

export function parseStopBlock( startBlock: string, stopBlock?: string ) {
    if (!stopBlock) return;
    if ( stopBlock.includes("+")) return String(Number(startBlock) + Number(stopBlock));
    if ( stopBlock.includes("-")) throw new Error(`stopBlock cannot be negative: ${stopBlock}`);
    return stopBlock;
}

export async function download( url: string ) {
    if ( isIpfs(url) ) url = `https://ipfs.pinax.network/ipfs/${url}`;
    const binary = await downloadBuffer(url);
    const { modules } = Package.fromBinary(binary);
    const registry = createRegistryFromDescriptors(binary);
    if ( !modules ) throw new Error(`No modules found in Substream: ${url}`);
    return { modules, registry };
}

export async function downloadBuffer(url: string) {
    console.log(`Downloading: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
    console.log(`Download completed: ${url}`);

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
}
