/**
 * Errors that mean the connection to Postgres was lost or the server can't take work right now, as
 * opposed to errors about the statement itself. On these, nothing that wasn't committed was kept,
 * so the work can be run again on a new connection.
 */
const CONNECTION_ERROR_CODES = new Set([
    // Node.js socket and DNS errors.
    "ECONNRESET",
    "ECONNREFUSED",
    "EPIPE",
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "ENOTFOUND",
    "EAI_AGAIN",
    // Postgres class 08: connection exception.
    "08000",
    "08001",
    "08003",
    "08004",
    "08006",
    // Postgres class 57P: the server is shutting down, crashed, or is still starting.
    "57P01",
    "57P02",
    "57P03",
    // read_only_sql_transaction: after a failover, the old writer restarts as a reader, and a stale DNS
    // entry can still point at it for a while.
    "25006"
]);

const CONNECTION_ERROR_MESSAGE =
    /Connection terminated|Client has encountered a connection error|terminating connection|Connection ended unexpectedly|timeout exceeded when trying to connect|the database system is (starting up|shutting down|in recovery)|cannot execute [A-Z ]+ in a read-only transaction/i;

export const isConnectionError = (error: unknown): boolean => {
    if (!error || typeof error !== "object") {
        return false;
    }
    const { code, message } = error as { code?: unknown; message?: unknown };
    if (typeof code === "string" && CONNECTION_ERROR_CODES.has(code)) {
        return true;
    }
    return typeof message === "string" && CONNECTION_ERROR_MESSAGE.test(message);
};
