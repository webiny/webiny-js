/**
 * Nothing in extraction may hang a task — see the design brief, section 10.6.
 *
 * A background task that stops making progress is worse than one that fails: it burns the full
 * fifteen minutes, reports nothing useful, and leaves the user watching a spinner. So every network
 * operation goes through here, and the rejection says which operation stalled rather than surfacing
 * a bare `TimeoutError` from somewhere inside the driver.
 */

export class OperationTimeoutError extends Error {
    readonly operation: string;
    readonly timeoutMs: number;

    constructor(operation: string, timeoutMs: number) {
        super(
            `${operation} did not finish within ${timeoutMs}ms. The site may be slow, very large, ` +
                `or blocking automated browsers. Try again, or extract a simpler page on the same site.`
        );
        this.name = "OperationTimeoutError";
        this.operation = operation;
        this.timeoutMs = timeoutMs;
    }
}

/**
 * Rejects with `OperationTimeoutError` if the promise has not settled in time.
 *
 * The timer is always cleared, including on the success path: an unref'd pending timer keeps a Lambda
 * invocation alive after the handler has returned, which reads as a hang even though the work is
 * done.
 */
export const withTimeout = async <T>(
    operation: string,
    timeoutMs: number,
    run: () => Promise<T>
): Promise<T> => {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
            () => reject(new OperationTimeoutError(operation, timeoutMs)),
            timeoutMs
        );
    });

    try {
        return await Promise.race([run(), timeout]);
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
};

/**
 * Runs an operation whose failure is not worth failing the crawl for, returning a fallback instead.
 *
 * Used for the best-effort steps — dismissing a cookie banner, reading a font list. A crawl that
 * abandons a whole page because a consent dialog would not close has traded a good result for no
 * result.
 */
export const withTimeoutOrDefault = async <T>(
    operation: string,
    timeoutMs: number,
    fallback: T,
    run: () => Promise<T>
): Promise<T> => {
    try {
        return await withTimeout(operation, timeoutMs, run);
    } catch {
        return fallback;
    }
};
