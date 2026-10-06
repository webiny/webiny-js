import type { ModelCall } from "./types.js";

/**
 * What model calls cost, computed when a report is made — never stored on the call rows, because prices
 * change and a stored dollar figure would quietly go stale while still looking authoritative.
 *
 * PRICES: USD per million tokens, Anthropic first-party API list prices.
 * TAKEN: 2026-10-06, from Anthropic's published model table (as cached 2026-09-25).
 *
 * Cache rates: where Anthropic lists a model's cache-read price it is used (`listed`). Otherwise the
 * standard Anthropic multipliers are applied — reads at 0.1x the input price, five-minute cache writes
 * at 1.25x — and the entry says so (`assumed`). Check both against the current price page before
 * quoting a figure outside the team.
 *
 * OpenAI models have no entry: their prices were not verified when this was written, so a call to one is
 * reported with its tokens and no cost, rather than with a guessed one.
 */
export const MODEL_PRICES_TAKEN_ON = "2026-10-06";

export interface ModelPrice {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    /** Whether the cache rates are published for this model or derived from the standard multipliers. */
    cacheRates: "listed" | "assumed";
}

const standard = (input: number, output: number): ModelPrice => ({
    input,
    output,
    cacheRead: input * 0.1,
    cacheWrite: input * 1.25,
    cacheRates: "assumed"
});

export const MODEL_PRICES: Readonly<Record<string, ModelPrice>> = {
    "claude-fable-5-1": {
        input: 10,
        output: 50,
        cacheRead: 0.25,
        cacheWrite: 12.5,
        cacheRates: "listed"
    },
    "claude-fable-5": standard(10, 50),
    "claude-opus-5-5": {
        input: 4,
        output: 20,
        cacheRead: 0.2,
        cacheWrite: 5,
        cacheRates: "listed"
    },
    "claude-opus-5": standard(5, 25),
    "claude-opus-4-8": standard(5, 25),
    "claude-opus-4-7": standard(5, 25),
    "claude-opus-4-6": standard(5, 25),
    "claude-sonnet-5-5": {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5,
        cacheRates: "listed"
    },
    "claude-sonnet-5": standard(2, 10),
    "claude-sonnet-4-6": standard(3, 15),
    "claude-haiku-4-5": standard(1, 5)
};

/**
 * The price entry for a model id: exact, else the longest entry the id starts with, so a dated or
 * suffixed id (`claude-haiku-4-5-20251001`) still finds its model. Null when nothing matches.
 */
export const priceFor = (modelId: string): ModelPrice | null => {
    const id = modelId.trim().toLowerCase();
    if (MODEL_PRICES[id]) {
        return MODEL_PRICES[id];
    }
    const match = Object.keys(MODEL_PRICES)
        .filter(key => id.startsWith(`${key}-`) || id.startsWith(`${key}@`))
        .sort((a, b) => b.length - a.length)[0];
    return match ? MODEL_PRICES[match] : null;
};

export type CostedTokens = Pick<
    ModelCall,
    "modelId" | "inputTokens" | "outputTokens" | "cacheReadTokens" | "cacheWriteTokens"
>;

export interface CallCost {
    /** USD, or null when the model has no price entry. */
    usd: number | null;
    /** What the cached input would have cost uncached, minus what it did cost. Null when unpriced. */
    cacheSavingUsd: number | null;
}

/**
 * One call's cost. `inputTokens` counts every input token, cached ones included, so the uncached part
 * is what is left after the cache reads and writes are taken out of it.
 */
export const costOfCall = (call: CostedTokens): CallCost => {
    const price = priceFor(call.modelId);
    if (!price) {
        return { usd: null, cacheSavingUsd: null };
    }
    const read = Math.max(0, call.cacheReadTokens ?? 0);
    const write = Math.max(0, call.cacheWriteTokens ?? 0);
    const uncached = Math.max(0, (call.inputTokens ?? 0) - read - write);
    const perToken = (perMillion: number) => perMillion / 1_000_000;

    const usd =
        uncached * perToken(price.input) +
        read * perToken(price.cacheRead) +
        write * perToken(price.cacheWrite) +
        Math.max(0, call.outputTokens ?? 0) * perToken(price.output);
    const cacheSavingUsd =
        (read + write) * perToken(price.input) -
        (read * perToken(price.cacheRead) + write * perToken(price.cacheWrite));

    return { usd, cacheSavingUsd };
};

export interface CostSummary {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    /** USD over the priced calls only. */
    usd: number;
    cacheSavingUsd: number;
    /** Calls with no price entry — their tokens are counted, their cost is not. */
    unpricedCalls: number;
}

/** Totals over a set of calls — a stage, a component, a site. */
export const summarizeCost = (calls: CostedTokens[]): CostSummary =>
    calls.reduce<CostSummary>(
        (total, call) => {
            const cost = costOfCall(call);
            return {
                calls: total.calls + 1,
                inputTokens: total.inputTokens + (call.inputTokens ?? 0),
                outputTokens: total.outputTokens + (call.outputTokens ?? 0),
                cacheReadTokens: total.cacheReadTokens + (call.cacheReadTokens ?? 0),
                cacheWriteTokens: total.cacheWriteTokens + (call.cacheWriteTokens ?? 0),
                usd: total.usd + (cost.usd ?? 0),
                cacheSavingUsd: total.cacheSavingUsd + (cost.cacheSavingUsd ?? 0),
                unpricedCalls: total.unpricedCalls + (cost.usd === null ? 1 : 0)
            };
        },
        {
            calls: 0,
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
            usd: 0,
            cacheSavingUsd: 0,
            unpricedCalls: 0
        }
    );
