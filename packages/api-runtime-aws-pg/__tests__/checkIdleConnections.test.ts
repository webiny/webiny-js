import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Knex } from "knex";
import { checkIdleConnections } from "~/connection/checkIdleConnections.js";

/**
 * Which idle connections the pool checks, keeps and drops, against a stand-in knex client whose
 * connections reply to the check as each test says. The clock is the test's.
 */

interface IFakeConnection {
    /** The statements the pool sent on this connection. */
    queries: string[];
    query(config: { text: string }, callback: (error: Error | null) => void): void;
}

/* A connection that replies to each query with what `reply` resolves to. */
const createConnection = (reply: () => Promise<Error | null>): IFakeConnection => {
    const queries: string[] = [];
    return {
        queries,
        query(config, callback) {
            queries.push(config.text);
            void reply().then(callback);
        }
    };
};

/* An error the server sent, as node-postgres gives it: with a `severity`. */
const serverError = (message: string) => Object.assign(new Error(message), { severity: "ERROR" });

describe("checking an idle pooled connection", () => {
    let now = 0;
    let client: {
        releaseConnection(connection: object): Promise<unknown>;
        validateConnection(connection: object): boolean | Promise<boolean>;
    };

    beforeEach(() => {
        now = 0;
        vi.spyOn(Date, "now").mockImplementation(() => now);
        client = {
            releaseConnection: async () => undefined,
            validateConnection: () => true
        };
        checkIdleConnections({ client } as unknown as Knex, {
            checkAfterIdleMs: 1_000,
            checkTimeoutMs: 2_000,
            maxIdleMs: 60_000
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("drops only the connection whose check the server answered with an error, and checks the next", async () => {
        const older = createConnection(async () => null);
        const newer = createConnection(async () => serverError("canceling statement"));
        await client.releaseConnection(older);
        now = 100;
        await client.releaseConnection(newer);

        now = 5_000;
        await expect(client.validateConnection(newer)).resolves.toBe(false);
        // The server is there: the older connection is checked, and kept.
        await expect(client.validateConnection(older)).resolves.toBe(true);
        expect(older.queries).toEqual(["SELECT 1"]);
    });

    it("drops without a check a connection released while a check that got no reply was waiting", async () => {
        let timeOut: (error: Error) => void = () => undefined;
        const silent = createConnection(() => new Promise(resolve => (timeOut = resolve)));
        const releasedDuringCheck = createConnection(async () => null);
        await client.releaseConnection(silent);

        now = 5_000;
        const checked = client.validateConnection(silent);
        now = 5_250;
        await client.releaseConnection(releasedDuringCheck);
        now = 7_000;
        timeOut(new Error("Query read timeout"));
        await expect(checked).resolves.toBe(false);

        // Idle 1.75 s, past the check threshold, but the checkout already waited for one check.
        await expect(client.validateConnection(releasedDuringCheck)).resolves.toBe(false);
        expect(releasedDuringCheck.queries).toEqual([]);

        // A connection released after that check gave up is checked again.
        const releasedAfter = createConnection(async () => null);
        now = 7_100;
        await client.releaseConnection(releasedAfter);
        now = 9_000;
        await expect(client.validateConnection(releasedAfter)).resolves.toBe(true);
        expect(releasedAfter.queries).toEqual(["SELECT 1"]);
    });
});
