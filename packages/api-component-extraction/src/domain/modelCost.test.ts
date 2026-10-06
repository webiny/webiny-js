import { describe, expect, it } from "vitest";
import { costOfCall, priceFor, summarizeCost, type CostedTokens } from "./modelCost.js";

const call = (overrides: Partial<CostedTokens>): CostedTokens => ({
    modelId: "claude-opus-5",
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    ...overrides
});

describe("priceFor", () => {
    it("finds a model by its exact id", () => {
        expect(priceFor("claude-opus-5")?.input).toBe(5);
    });

    it("finds a dated or suffixed id by its model", () => {
        expect(priceFor("claude-haiku-4-5-20251001")?.input).toBe(1);
    });

    it("does not confuse a model with one whose id it starts with", () => {
        expect(priceFor("claude-opus-5-5")?.input).toBe(4);
        expect(priceFor("claude-opus-5")?.input).toBe(5);
    });

    it("finds a model recorded with its vendor prefix, as AI Power-Ups records it", () => {
        expect(priceFor("anthropic/claude-sonnet-5")?.input).toBe(2);
    });

    it("does not price another vendor's model by dropping its prefix", () => {
        expect(priceFor("openai/gpt-5.5")).toBeNull();
    });

    it("has no price for a model it does not list", () => {
        expect(priceFor("gpt-5.5")).toBeNull();
    });
});

describe("costOfCall", () => {
    it("prices an uncached call at input and output rates", () => {
        // 10k in at $5/M + 4k out at $25/M = $0.05 + $0.10
        expect(costOfCall(call({ inputTokens: 10_000, outputTokens: 4_000 })).usd).toBeCloseTo(
            0.15
        );
    });

    it("prices cache reads and writes inside the input total at their own rates", () => {
        // 10k input of which 7k read from cache, 1k written: 2k uncached.
        const cost = costOfCall(
            call({ inputTokens: 10_000, cacheReadTokens: 7_000, cacheWriteTokens: 1_000 })
        );
        const expected = (2_000 * 5 + 7_000 * 0.5 + 1_000 * 6.25) / 1_000_000;
        expect(cost.usd).toBeCloseTo(expected);
        // Saving: 8k at $5/M uncached, minus what the read and write actually cost.
        expect(cost.cacheSavingUsd).toBeCloseTo((8_000 * 5 - (7_000 * 0.5 + 1_000 * 6.25)) / 1e6);
    });

    it("uses a model's listed cache-read price", () => {
        expect(
            costOfCall(call({ modelId: "claude-opus-5-5", inputTokens: 1e6, cacheReadTokens: 1e6 }))
                .usd
        ).toBeCloseTo(0.2);
    });

    it("reports an unpriced model's cost as unknown, not zero", () => {
        expect(costOfCall(call({ modelId: "gpt-5.5", inputTokens: 1000 }))).toEqual({
            usd: null,
            cacheSavingUsd: null
        });
    });
});

describe("summarizeCost", () => {
    it("totals tokens over every call and cost over the priced ones", () => {
        const summary = summarizeCost([
            call({ inputTokens: 10_000, outputTokens: 4_000 }),
            call({ modelId: "gpt-5.5", inputTokens: 1_000, outputTokens: 500 })
        ]);
        expect(summary.calls).toBe(2);
        expect(summary.inputTokens).toBe(11_000);
        expect(summary.outputTokens).toBe(4_500);
        expect(summary.usd).toBeCloseTo(0.15);
        expect(summary.unpricedCalls).toBe(1);
    });
});
