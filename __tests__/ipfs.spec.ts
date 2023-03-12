import assert from 'node:assert';
import { describe, it } from 'node:test';
import * as ipfs from '../src/ipfs';

describe('ipfs', () => {
    it("test", () => {
        assert.equal(ipfs.test("QmUatvHNjq696qkB8SBz5VBytcEeTrM1VwFyy4Rt4Z43mX"), true);
        assert.equal(ipfs.test("not IPFS"), false);
    });
});
