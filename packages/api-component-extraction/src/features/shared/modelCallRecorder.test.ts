import { describe, expect, it } from "vitest";
import { readUsage } from "./modelCallRecorder.js";

describe("readUsage", () => {
    it("reads the SDK's usage with cache reads and writes as parts of the input", () => {
        expect(
            readUsage({
                inputTokens: 12_000,
                outputTokens: 3_000,
                inputTokenDetails: {
                    noCacheTokens: 1_000,
                    cacheReadTokens: 10_000,
                    cacheWriteTokens: 1_000
                }
            })
        ).toEqual({
            inputTokens: 12_000,
            outputTokens: 3_000,
            cacheReadTokens: 10_000,
            cacheWriteTokens: 1_000
        });
    });

    it("reads a usage with no cache details as uncached", () => {
        expect(readUsage({ inputTokens: 500, outputTokens: 20 })).toEqual({
            inputTokens: 500,
            outputTokens: 20,
            cacheReadTokens: 0,
            cacheWriteTokens: 0
        });
    });

    it("reads the older prompt/completion names and nothing at all", () => {
        expect(readUsage({ promptTokens: 7, completionTokens: 3 })).toMatchObject({
            inputTokens: 7,
            outputTokens: 3
        });
        expect(readUsage(undefined)).toEqual({
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheWriteTokens: 0
        });
    });
});
