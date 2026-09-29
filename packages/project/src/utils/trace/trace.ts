import { traceRecorder } from "./TraceRecorder.js";

/* Times a synchronous phase of a CLI run. A no-op unless `WEBINY_CLI_TRACE` is set. */
export function trace<T>(label: string, fn: () => T): T {
    if (!traceRecorder.enabled) {
        return fn();
    }

    const stop = traceRecorder.start(label);

    try {
        return fn();
    } finally {
        stop();
    }
}
