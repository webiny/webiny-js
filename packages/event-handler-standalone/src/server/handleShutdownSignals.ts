import type http from "node:http";

// The signals a process manager, `docker stop`, Kubernetes or Ctrl+C send to ask for a clean exit.
const SHUTDOWN_SIGNALS = ["SIGTERM", "SIGINT"] as const;

/*
 * The most a shutdown may take before the process exits anyway. Under Docker's default of 10 seconds,
 * after which `docker stop` kills the process outright.
 */
const SHUTDOWN_TIMEOUT_MS = 8000;

interface IHandleShutdownSignalsParams {
    server: http.Server;
    shutdown: () => Promise<void>;
}

/**
 * Exits cleanly on the first SIGTERM or SIGINT: stops taking connections, runs `shutdown` for at
 * most `SHUTDOWN_TIMEOUT_MS`, then exits. A second signal exits at once, for someone who pressed
 * Ctrl+C twice. Handling a signal replaces Node's default of exiting, so this always exits itself.
 */
export function handleShutdownSignals(params: IHandleShutdownSignalsParams): void {
    const { server, shutdown } = params;
    let stopping = false;

    const onSignal = async (signal: string) => {
        stopping = true;
        console.log(`[server] ${signal} received, shutting down`);

        // New connections are refused; idle keep-alive ones are closed, busy ones may finish.
        server.close();
        server.closeIdleConnections();

        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<void>(resolve => {
            timer = setTimeout(resolve, SHUTDOWN_TIMEOUT_MS);
        });
        try {
            const done = shutdown();
            await Promise.race([done, timeout]);
        } catch (error) {
            console.error("[server] shutdown failed:", error);
        } finally {
            clearTimeout(timer);
        }
        process.exit(0);
    };

    for (const signal of SHUTDOWN_SIGNALS) {
        process.on(signal, () => {
            if (stopping) {
                process.exit(1);
            } else {
                void onSignal(signal);
            }
        });
    }
}
