import type { Knex } from "knex";

/** Time between two attempts, at most. */
const ATTEMPT_INTERVAL_MS = 5_000;

/**
 * How long one attempt may take, at most. Unbounded, one attempt can take 15–30 s against a proxy
 * that refuses connections (the connection's acquire timeout, then its retry of a lost connection),
 * and run past the wait's end.
 */
const ATTEMPT_TIMEOUT_MS = 10_000;

/** The shortest attempt: the first one runs even when the wait has no time left. */
const MIN_ATTEMPT_TIMEOUT_MS = 1_000;

/** How long closing an attempt's connection may take, at most. */
const CLOSE_TIMEOUT_MS = 5_000;

const errorMessage = (error: unknown): string => {
    return error instanceof Error ? error.message || error.name : String(error);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Settles as `promise` does, or rejects when it hasn't within `ms`. */
const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
            () => reject(new Error(`no answer within ${Math.ceil(ms / 1000)} s`)),
            ms
        );
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timer);
    }
};

export interface WaitForApiConnectionParams {
    /** Opens a connection the way the API's requests do; called once per attempt. */
    open: () => Knex;
    /**
     * How long to keep trying. An attempt ends by then, and its connection closes within a few
     * seconds after.
     */
    waitMs: number;
}

/**
 * Opens a connection the way the API does and runs `SELECT 1` on it, again every few seconds until
 * the database accepts it or `waitMs` has passed. A new RDS Proxy refuses connections for a few
 * minutes after its target registers (at the end of `deploy core`); without this wait, an api deploy
 * right after it finishes while the API can't reach the database, and AutoInstall fails.
 *
 * Returns how it went, as a line of the setup's result. Throws when no attempt succeeded, so the
 * deploy fails with an error that says what to check.
 */
export const waitForApiConnection = async ({
    open,
    waitMs
}: WaitForApiConnectionParams): Promise<string> => {
    const start = Date.now();
    const deadline = start + waitMs;
    let attempts = 0;
    let lastError: unknown;

    while (true) {
        attempts++;
        const attemptMs = Math.min(
            ATTEMPT_TIMEOUT_MS,
            Math.max(deadline - Date.now(), MIN_ATTEMPT_TIMEOUT_MS)
        );
        const knex = open();
        try {
            await withTimeout(knex.raw("SELECT 1"), attemptMs);
            const seconds = Math.round((Date.now() - start) / 1000);
            return `api connection accepted (attempt ${attempts}, after ${seconds} s)`;
        } catch (error) {
            lastError = error;
            console.warn(
                `The API's database connection was refused (attempt ${attempts}): ${errorMessage(error)}`
            );
        } finally {
            await withTimeout(knex.destroy(), CLOSE_TIMEOUT_MS).catch(() => undefined);
        }

        const remaining = deadline - Date.now();
        if (remaining <= 0) {
            break;
        }
        await sleep(Math.min(ATTEMPT_INTERVAL_MS, remaining));
    }

    const seconds = Math.round(waitMs / 1000);
    throw new Error(
        `The API can't connect to the database: its connection (WEBINY_PG_HOST) was refused for ${seconds} s, ` +
            `${attempts} attempts. Last error: ${errorMessage(lastError)}. ` +
            "A new RDS Proxy can take a few minutes after `deploy core` to accept connections: " +
            "deploy the api again. If it keeps failing, check the proxy's target health in the RDS " +
            "console and that its security group lets the API functions in."
    );
};
