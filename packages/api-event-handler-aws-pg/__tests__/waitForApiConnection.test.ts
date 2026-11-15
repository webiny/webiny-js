import { afterEach, describe, expect, it, vi } from "vitest";
import type { Knex } from "knex";
import { waitForApiConnection } from "~/schemaSetup/waitForApiConnection.js";

/* A connection the database refuses at once, as a proxy whose target isn't available yet. */
const refused = () =>
    ({
        raw: () => Promise.reject(new Error("Connection terminated unexpectedly")),
        destroy: async () => undefined
    }) as unknown as Knex;

describe("waitForApiConnection", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("ends a later attempt by the end of the wait, even when it gets no answer", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        // Refused at once, then taken by a proxy that never answers.
        const open = vi.fn(() =>
            open.mock.calls.length === 1
                ? refused()
                : ({
                      raw: () => new Promise(() => undefined),
                      destroy: async () => undefined
                  } as unknown as Knex)
        );

        const started = Date.now();
        const error = await waitForApiConnection({ open, waitMs: 1500 }).then(
            () => undefined,
            (error: Error) => error
        );

        expect(open).toHaveBeenCalledTimes(2);
        expect(error?.message).toMatch(/, 2 attempts\. Last error: no answer within 1 s\./);
        expect(Date.now() - started).toBeLessThan(1500 + 250);
    });

    it("starts no attempt after the first when too little of the wait is left for one", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const open = vi.fn(refused);

        const started = Date.now();
        const error = await waitForApiConnection({ open, waitMs: 200 }).then(
            () => undefined,
            (error: Error) => error
        );

        expect(open).toHaveBeenCalledTimes(1);
        expect(error?.message).toMatch(/, 1 attempts\. Last error: Connection terminated/);
        // It doesn't sleep out a wait it can't use.
        expect(Date.now() - started).toBeLessThan(100);
    });

    it("still makes the first attempt when there is no time to wait", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const open = vi.fn(refused);

        const error = await waitForApiConnection({ open, waitMs: 0 }).then(
            () => undefined,
            (error: Error) => error
        );

        expect(open).toHaveBeenCalledTimes(1);
        expect(error?.message).toMatch(/was refused for 0 s, 1 attempts\./);
    });
});
