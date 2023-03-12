import fs from "node:fs";
import path from "node:path"
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { formatDate, parseStopBlock, unpack } from '../src/utils';

const spkg = fs.readFileSync(path.join(__dirname, "..", "examples", "subtivity-ethereum.spkg"));

describe('utils', () => {
    it("formatDate", () => {
        assert.equal(formatDate(1670515200), "2022-12-08T16:00:00");
    });

    it("parseStopBlock", async () => {
        assert.equal(parseStopBlock("0", "+100"), "100");
        assert.equal(parseStopBlock("400", "+100"), "500");
    });

    it("unpack.modules", async () => {
        const { modules } = unpack(spkg);

        assert.equal(modules.modules.length, 2);
        assert.equal(modules.binaries.length, 2);
    });

    it("unpack.registry", async () => {
        const { registry } = unpack(spkg);

        const message = registry.findMessage("subtivity.v1.BlockStats");
        const service = registry.findService("sf.substreams.v1.Stream");
        assert.ok(message); 
        assert.ok(service); 
    });

});
