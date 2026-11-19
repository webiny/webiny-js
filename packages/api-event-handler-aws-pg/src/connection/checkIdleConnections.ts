import type { Knex } from "knex";

export interface ICheckIdleConnectionsOptions {
    /** A connection idle at least this long is checked with a round trip before it's handed out. */
    checkAfterIdleMs: number;
    /** How long the check waits for the server's reply before the connection is dropped. */
    checkTimeoutMs: number;
    /**
     * A connection idle at least this long is dropped without a check: the pool's idle timeout,
     * whose reaping doesn't run while the environment is frozen.
     */
    maxIdleMs: number;
}

/* The node-postgres client the pool holds. */
interface IPgClient {
    query(
        config: { text: string; query_timeout?: number },
        callback: (error: Error | null) => void
    ): void;
}

/* The knex client methods the pool calls on checkout and on release. */
interface IKnexClient {
    releaseConnection(connection: object): Promise<unknown>;
    validateConnection(connection: object): boolean | Promise<boolean>;
}

/*
 * How the server took the check:
 * - `answered`: it ran it;
 * - `refused`: it answered with an error (a cancelled statement, for example), so it's there;
 * - `unanswered`: no reply within the timeout, or the connection failed (closed, reset).
 */
type CheckResult = "answered" | "refused" | "unanswered";

/* Sends the check on this connection and waits up to `timeoutMs` for the server's reply. */
const check = (connection: IPgClient, timeoutMs: number): Promise<CheckResult> => {
    return new Promise(resolve => {
        try {
            connection.query({ text: "SELECT 1", query_timeout: timeoutMs }, error => {
                if (!error) {
                    resolve("answered");
                    return;
                }
                // node-postgres gives an error the server sent a `severity`; its own (a timeout,
                // a closed or reset connection) have none.
                resolve("severity" in error ? "refused" : "unanswered");
            });
        } catch {
            resolve("unanswered");
        }
    });
};

/**
 * Keeps the pool from handing out a connection that died while it sat idle, in a Lambda
 * environment. Between requests the environment is frozen: no timer or socket event runs, so the
 * pool doesn't see a connection the server ended meanwhile (`idle_session_timeout`, a failover, a
 * network path that dropped the idle flow), and its idle reaping doesn't run. After the thaw, the
 * next request could get that connection: a write outside a transaction (which isn't retried)
 * would fail, and a connection nothing answers on would hang the request.
 *
 * So, on checkout, a connection that was idle:
 * - `maxIdleMs` or longer is dropped, as the pool's reaping would have done;
 * - `checkAfterIdleMs` or longer gets a `SELECT 1` first, and is dropped if the server doesn't
 *   run it: no reply within `checkTimeoutMs`, a failed connection, or an error reply;
 * - `checkAfterIdleMs` or longer, released before a check got no reply (gave up or failed), is
 *   dropped without a check: what ended that connection (a failover, the server's idle timeout,
 *   a dropped network path) most likely ended this one too. When a connection is dropped, the pool
 *   tries the next free one for the same checkout, and every free one was released before that
 *   check gave up, so a checkout waits for at most one check that gets no reply, however many idle
 *   connections died. Checking each would take longer than the pool waits for a connection. An
 *   error reply drops only its own connection: the server is there.
 *
 * A dropped connection is closed and the pool opens a new one, for every kind of query: reads,
 * writes, transactions with or without a callback, raw statements. A connection used moments ago
 * is handed out without a round trip.
 */
export const checkIdleConnections = (knex: Knex, options: ICheckIdleConnectionsOptions): void => {
    const client = knex.client as unknown as IKnexClient;
    const releasedAt = new WeakMap<object, number>();
    // When the latest check that got no reply gave up.
    let unansweredAt = -Infinity;

    const releaseConnection = client.releaseConnection;
    client.releaseConnection = function (this: IKnexClient, connection: object) {
        releasedAt.set(connection, Date.now());
        return releaseConnection.call(this, connection);
    };

    // knex's own check on checkout (a connection whose error or end it saw) runs before this one.
    const validateConnection = client.validateConnection;
    client.validateConnection = async function (this: IKnexClient, connection: object) {
        const released = releasedAt.get(connection);
        if (released !== undefined) {
            const idleMs = Date.now() - released;
            if (idleMs >= options.maxIdleMs) {
                return false;
            }
            if (idleMs >= options.checkAfterIdleMs) {
                if (released <= unansweredAt) {
                    return false;
                }
                const result = await check(connection as IPgClient, options.checkTimeoutMs);
                if (result === "unanswered") {
                    unansweredAt = Date.now();
                }
                if (result !== "answered") {
                    return false;
                }
            }
        }
        return validateConnection.call(this, connection);
    };
};
