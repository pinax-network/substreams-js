import assert from 'node:assert';
import { describe, it } from 'node:test';
import { formatDate, getIpfsHash } from './utils';

describe('substreams', () => {
    it("formatDate", () => {
        assert.equal(formatDate(1670515200), "2022-12-08T16:00:00");
    });

    it("getIpfsHash", async () => {
        assert.equal(await getIpfsHash(new Uint8Array([1,2,3,4,5])), "QmUatvHNjq696qkB8SBz5VBytcEeTrM1VwFyy4Rt4Z43mX");
    });
});

/**
 * Expect a promise to throw an error with a specific message.
 * @param promise - The promise to await.
 * @param {string} errorMsg - The error message that we expect to see.
 */
const expectToThrow = async (promise: Promise<any>, errorMsg: string) => {
    try {
        await promise
        assert.fail('Expected promise to throw an error');
    } catch (e: any) {
        if ( errorMsg ) assert.equal(e.message, errorMsg);
        else assert.fail('Expected promise to throw an error');
    }
}