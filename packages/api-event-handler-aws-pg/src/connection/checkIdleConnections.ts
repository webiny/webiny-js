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

/* Whether the server answers on this connection within `timeoutMs`. */
const answers = (connection: IPgClient, timeoutMs: number): Promise<boolean> => {
    return new Promise(resolve => {
        try {
            connection.query({ text: "SELECT 1", query_timeout: timeoutMs }, error => {
                resolve(!error);
            });
        } catch {
            resolve(false);
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
 *   answer within `checkTimeoutMs`;
 * - at least as long as one that didn't answer its check (released no later than it) is dropped
 *   without a check: what ended that one (a failover, the server's idle timeout, a dropped network path) most likely
 *   ended it too. The pool hands out the most recently released connection first and, when it's
 *   dropped, tries the next one for the same checkout, so a checkout waits for at most one check
 *   that gets no answer, however many idle connections died. Checking each would take longer
 *   than the pool waits for a connection.
 *
 * A dropped connection is closed and the pool opens a new one, for every kind of query: reads,
 * writes, transactions with or without a callback, raw statements. A connection used moments ago
 * is handed out without a round trip.
 */
export const checkIdleConnections = (knex: Knex, options: ICheckIdleConnectionsOptions): void => {
    const client = knex.client as unknown as IKnexClient;
    const releasedAt = new WeakMap<object, number>();
    // When the latest connection that didn't answer its check was released.
    let unansweredReleasedAt = -Infinity;

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
                if (released <= unansweredReleasedAt) {
                    return false;
                }
                if (!(await answers(connection as IPgClient, options.checkTimeoutMs))) {
                    unansweredReleasedAt = Math.max(unansweredReleasedAt, released);
                    return false;
                }
            }
        }
        return validateConnection.call(this, connection);
    };
};
