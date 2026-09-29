import { traceRecorder } from "./TraceRecorder.js";

/* Times an asynchronous phase of a CLI run. A no-op unless `WEBINY_CLI_TRACE` is set. */
export async function traceAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!traceRecorder.enabled) {
        return fn();
    }

    const stop = traceRecorder.start(label);

    try {
        return await fn();
    } finally {
        stop();
    }
}
