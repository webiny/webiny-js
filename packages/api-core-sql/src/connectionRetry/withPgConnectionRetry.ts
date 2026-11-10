import type { Knex } from "knex";
import { isConnectionError } from "./isConnectionError.js";

/**
 * Makes a Postgres knex instance survive a lost connection (a database failover, a dropped proxy
 * connection, a server restart) without failing the API request, where that is safe:
 *
 * - A transaction (`knex.transaction(async trx => …)`) that loses its connection before COMMIT is sent
 *   is run again: the server rolled it back, so nothing of it was kept.
 * - A transaction that loses its connection during COMMIT may or may not have committed. Before
 *   COMMIT, the transaction reads its own ID; after the failure, the wrapper asks the server for that
 *   transaction's outcome (`pg_xact_status`) on a new connection. Committed: the result is returned
 *   as is, and the work is not repeated. Rolled back: the transaction is run again. Unknown: the
 *   error is thrown.
 * - A read-only transaction that fails at COMMIT returns its result: there was nothing to commit.
 * - A read outside a transaction (a SELECT) is run again.
 *
 * Retries wait 100 ms, 250 ms, 500 ms, 1 s, then every 2 s, until `maxRetryMs` has passed since the
 * first failure; then the last error is thrown. Errors that aren't about the connection (a constraint
 * violation, a syntax error, a timeout of the statement itself) are never retried.
 *
 * A transaction's callback is run again on a retry, so it must only change the database: a call to
 * another service inside it would be repeated.
 *
 * Writes outside a transaction are not retried: their outcome can't be checked.
 */

export type PgConnectionRetryEventType =
    /** A connection error; the operation runs again after `delayMs`. */
    | "retry"
    /** COMMIT failed, but the server confirmed that the transaction committed: no retry needed. */
    | "commitConfirmed"
    /** COMMIT failed, and the server confirmed that the transaction was rolled back: it runs again. */
    | "commitRolledBack"
    /** COMMIT failed for a transaction that changed nothing: its result is returned. */
    | "readOnlyCommitIgnored"
    /** Retries ran out (time or an unknown transaction outcome): the error is thrown. */
    | "gaveUp";

export interface IPgConnectionRetryEvent {
    type: PgConnectionRetryEventType;
    operation: "transaction" | "query";
    /** Retries so far for this operation. */
    attempt: number;
    delayMs?: number;
    error: unknown;
}

export interface IPgConnectionRetryOptions {
    /** How long to keep retrying after an operation's first connection error. Default: 15,000 ms. */
    maxRetryMs?: number;
    onEvent?: (event: IPgConnectionRetryEvent) => void;
}

const DELAYS_MS = [100, 250, 500, 1000, 2000];
/** How often to ask again while the server still reports the transaction as in progress. */
const IN_PROGRESS_CHECKS = 5;

const RETRY_INSTALLED = Symbol.for("webiny.pgConnectionRetry");

/* Statements that can't change data, so a transaction made only of them has nothing to lose. */
const READ_STATEMENT = /^\s*(select|show|explain|set|with)\b/i;
/* Anything in a statement that changes data or takes a session lock. */
const WRITE_KEYWORDS =
    /\b(insert\s+into|update\s+\S+\s+set|delete\s+from|merge\s+into|truncate|create|alter|drop|grant|revoke|copy|nextval|setval|pg_advisory_lock|pg_try_advisory_lock)\b/i;

const mayWrite = (sql: string): boolean => {
    return !READ_STATEMENT.test(sql) || WRITE_KEYWORDS.test(sql);
};

const READ_METHODS = new Set(["select", "first", "pluck"]);

/* A query builder or raw statement that only reads. */
const isReadOnlyBuilder = (builder: { _method?: unknown; sql?: unknown }): boolean => {
    if (typeof builder._method === "string") {
        return READ_METHODS.has(builder._method);
    }
    if (typeof builder.sql === "string") {
        return /^\s*(select|show|explain)\b/i.test(builder.sql) && !mayWrite(builder.sql);
    }
    return false;
};

/* Thrown inside an attempt to stop retrying; carries the error to throw. */
class StopRetrying {
    public constructor(public readonly error: unknown) {}
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type TransactionCallback = (trx: Knex.Transaction) => Promise<unknown> | unknown;

interface IRunner {
    run(): Promise<unknown>;
}

interface IClientWithRunner {
    runner(builder: unknown): IRunner;
}

interface ITransactionState {
    /* COMMIT has been sent (or is about to be). */
    committing: boolean;
    /* A statement that may have changed data ran. */
    wrote: boolean;
    xid: string | null;
    pid: number | null;
    result: unknown;
}

export const withPgConnectionRetry = (
    knex: Knex,
    options: IPgConnectionRetryOptions = {}
): Knex => {
    const target = knex as Knex & { [RETRY_INSTALLED]?: boolean };
    const clientName = String((knex.client as { config?: { client?: unknown } }).config?.client);
    if (target[RETRY_INSTALLED] || !["pg", "postgres", "postgresql"].includes(clientName)) {
        return knex;
    }
    target[RETRY_INSTALLED] = true;

    const maxRetryMs = options.maxRetryMs ?? 15_000;
    const emit = (event: IPgConnectionRetryEvent) => {
        try {
            options.onEvent?.(event);
        } catch {
            // A failing listener must not change the outcome of the query.
        }
    };

    /* Runs `attempt` until it succeeds, throws a non-connection error, or time runs out. */
    const retrying = async <T>(
        operation: IPgConnectionRetryEvent["operation"],
        attempt: (attemptNumber: number) => Promise<T>
    ): Promise<T> => {
        let firstFailureAt: number | undefined;
        for (let attemptNumber = 0; ; attemptNumber++) {
            try {
                return await attempt(attemptNumber);
            } catch (error) {
                if (error instanceof StopRetrying) {
                    throw error.error;
                }
                if (!isConnectionError(error)) {
                    throw error;
                }
                firstFailureAt ??= Date.now();
                const delayMs = DELAYS_MS[Math.min(attemptNumber, DELAYS_MS.length - 1)];
                if (Date.now() - firstFailureAt + delayMs > maxRetryMs) {
                    emit({ type: "gaveUp", operation, attempt: attemptNumber, error });
                    throw error;
                }
                emit({ type: "retry", operation, attempt: attemptNumber, delayMs, error });
                await sleep(delayMs);
            }
        }
    };

    // Reads outside a transaction. Transactions run their queries on their own client object (knex
    // creates it from the client's prototype), so this only sees statements outside transactions.
    const client = knex.client as unknown as IClientWithRunner;
    const originalRunner = client.runner;
    client.runner = function (this: IClientWithRunner, builder: unknown): IRunner {
        const runner = originalRunner.call(this, builder);
        if (!isReadOnlyBuilder(builder as Parameters<typeof isReadOnlyBuilder>[0])) {
            return runner;
        }
        const firstRun = runner.run.bind(runner);
        runner.run = () => {
            return retrying("query", attemptNumber => {
                return attemptNumber === 0
                    ? firstRun()
                    : originalRunner.call(client, builder).run();
            });
        };
        return runner;
    };

    const originalTransaction = knex.transaction;

    /* The outcome of a transaction whose COMMIT failed: "committed", "aborted" or null (unknown). */
    const transactionOutcome = async (xid: string, pid: number | null): Promise<string | null> => {
        for (let check = 0; check < IN_PROGRESS_CHECKS; check++) {
            // A read outside a transaction: retried on connection errors by the runner above.
            const result = await knex.raw<{ rows: { status: string | null }[] }>(
                "SELECT pg_xact_status(?::xid8)::text AS status",
                [xid]
            );
            const status = result.rows[0]?.status ?? null;
            if (status !== "in progress") {
                return status;
            }
            // The server still has the transaction open. If its session is idle (the COMMIT never
            // arrived), end the session: the transaction is rolled back, and the next check says so.
            if (pid !== null) {
                await knex.raw(
                    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
                     WHERE pid = ? AND backend_xid = (?::xid8)::xid AND state LIKE 'idle in transaction%'`,
                    [pid, xid]
                );
            }
            await sleep(DELAYS_MS[Math.min(check, DELAYS_MS.length - 1)]);
        }
        return null;
    };

    const runTransactionOnce = async (
        callback: TransactionCallback,
        config: Knex.TransactionConfig | undefined,
        attemptNumber: number
    ): Promise<unknown> => {
        const state: ITransactionState = {
            committing: false,
            wrote: false,
            xid: null,
            pid: null,
            result: undefined
        };
        try {
            return await originalTransaction.call(
                knex,
                async (trx: Knex.Transaction) => {
                    trx.on("query", (query: { sql?: string }) => {
                        if (!state.wrote && typeof query.sql === "string" && mayWrite(query.sql)) {
                            state.wrote = true;
                        }
                    });
                    const result = await callback(trx);
                    state.result = result;
                    if (state.wrote) {
                        // The transaction's ID, if it has one (it gets one when it changes data), so
                        // its outcome can be checked if COMMIT fails.
                        const ids = await trx.raw<{ rows: { xid: string | null; pid: number }[] }>(
                            "SELECT pg_current_xact_id_if_assigned()::text AS xid, pg_backend_pid() AS pid"
                        );
                        state.xid = ids.rows[0]?.xid ?? null;
                        state.pid = ids.rows[0]?.pid ?? null;
                    }
                    state.committing = true;
                    return result;
                },
                config
            );
        } catch (error) {
            if (!state.committing || !isConnectionError(error)) {
                // Before COMMIT, a connection error is retried by the caller: the server rolled the
                // transaction back. Other errors are thrown.
                throw error;
            }
            if (!state.xid) {
                emit({
                    type: "readOnlyCommitIgnored",
                    operation: "transaction",
                    attempt: attemptNumber,
                    error
                });
                return state.result;
            }
            const outcome = await transactionOutcome(state.xid, state.pid);
            if (outcome === "committed") {
                emit({
                    type: "commitConfirmed",
                    operation: "transaction",
                    attempt: attemptNumber,
                    error
                });
                return state.result;
            }
            if (outcome === "aborted") {
                emit({
                    type: "commitRolledBack",
                    operation: "transaction",
                    attempt: attemptNumber,
                    error
                });
                throw error;
            }
            emit({ type: "gaveUp", operation: "transaction", attempt: attemptNumber, error });
            throw new StopRetrying(error);
        }
    };

    Object.defineProperty(knex, "transaction", {
        configurable: true,
        enumerable: true,
        writable: false,
        value: function transaction(this: Knex, ...args: unknown[]) {
            const [callback, config] = args;
            if (typeof callback !== "function") {
                // No callback: the caller commits and rolls back by hand; nothing to retry.
                return (originalTransaction as (...a: unknown[]) => unknown).apply(knex, args);
            }
            return retrying("transaction", attemptNumber => {
                return runTransactionOnce(
                    callback as TransactionCallback,
                    config as Knex.TransactionConfig | undefined,
                    attemptNumber
                );
            });
        }
    });

    return knex;
};
