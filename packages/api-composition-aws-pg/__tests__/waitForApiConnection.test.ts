import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Knex } from "knex";
import { waitForApiConnection } from "~/schemaSetup/waitForApiConnection.js";

/* A connection the database refuses at once, as a proxy whose target isn't available yet. */
const refused = () =>
    ({
        raw: () => Promise.reject(new Error("Connection terminated unexpectedly")),
        destroy: async () => undefined
    }) as unknown as Knex;

/* Starts the wait and keeps track of when it settles, on the fake clock. */
const startWait = (params: Parameters<typeof waitForApiConnection>[0]) => {
    const started = Date.now();
    const state: { error?: Error; settledAfterMs?: number } = {};
    const done = waitForApiConnection(params).then(
        () => {
            state.settledAfterMs = Date.now() - started;
        },
        (error: Error) => {
            state.error = error;
            state.settledAfterMs = Date.now() - started;
        }
    );
    return { state, done };
};

describe("waitForApiConnection", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("ends a later attempt by the end of the wait, even when it gets no answer", async () => {
        // Refused at once, then taken by a proxy that never answers.
        const open = vi.fn(() =>
            open.mock.calls.length === 1
                ? refused()
                : ({
                      raw: () => new Promise(() => undefined),
                      destroy: async () => undefined
                  } as unknown as Knex)
        );

        const { state, done } = startWait({ open, waitMs: 1500 });

        // The first attempt is refused at once; the second starts after a pause it can afford.
        await vi.advanceTimersByTimeAsync(1499);
        expect(open).toHaveBeenCalledTimes(2);
        expect(state.settledAfterMs).toBeUndefined();

        // The second attempt's timeout ends it exactly at the end of the wait.
        await vi.advanceTimersByTimeAsync(1);
        await done;
        expect(state.settledAfterMs).toBe(1500);
        expect(open).toHaveBeenCalledTimes(2);
        expect(state.error?.message).toMatch(/, 2 attempts\. Last error: no answer within 1 s\./);
    });

    it("starts no attempt after the first when too little of the wait is left for one", async () => {
        const open = vi.fn(refused);

        const { state, done } = startWait({ open, waitMs: 200 });

        // It doesn't sleep out a wait it can't use: it gives up without any time passing.
        await vi.advanceTimersByTimeAsync(0);
        await done;
        expect(state.settledAfterMs).toBe(0);
        expect(open).toHaveBeenCalledTimes(1);
        expect(state.error?.message).toMatch(/, 1 attempts\. Last error: Connection terminated/);
    });

    it("still makes the first attempt when there is no time to wait", async () => {
        const open = vi.fn(refused);

        const { state, done } = startWait({ open, waitMs: 0 });

        await vi.advanceTimersByTimeAsync(0);
        await done;
        expect(open).toHaveBeenCalledTimes(1);
        expect(state.error?.message).toMatch(/was refused for 0 s, 1 attempts\./);
    });
});
