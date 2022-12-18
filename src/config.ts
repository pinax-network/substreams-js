import * as dotenv from "dotenv";
dotenv.config();

if ( !process.env.START_BLOCK_NUM) throw new Error("Missing START_BLOCK_NUM environment variable");
if ( !process.env.MODULES) throw new Error("Missing MODULES environment variable");
if ( !process.env.PACKAGE) throw new Error("Missing PACKAGE environment variable");
if ( !process.env.PROTO) throw new Error("Missing PROTO environment variable");

export const PACKAGE = process.env.PACKAGE;
export const PROTO = process.env.PROTO;
export const MODULES = process.env.MODULES.split(",");
export const START_BLOCK_NUM = process.env.START_BLOCK_NUM;
export const STOP_BLOCK_NUM = process.env.STOP_BLOCK_NUM;
export const API_TOKEN = process.env.API_TOKEN;
export const FIREHOSE_HOST = process.env.FIREHOSE_HOST || "eos.firehose.eosnation.io:9001";

if ( !Number.isInteger(Number(START_BLOCK_NUM))) throw new Error("START_BLOCK_NUM must be an integer");
if ( STOP_BLOCK_NUM && !Number.isInteger(Number(STOP_BLOCK_NUM))) throw new Error("START_BLOCK_NUM must be an integer");