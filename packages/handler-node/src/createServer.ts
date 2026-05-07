import { createHandler as createBaseHandler } from "@webiny/handler";
import { PluginsContainer } from "@webiny/plugins";
import type { CreateServerParams, NodeServer } from "./types.js";
import { createHealthRoutePlugin } from "./plugins/HealthRoutePlugin.js";

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 8080;
const DEFAULT_HEALTH_PATH = "/health" as const;

const SHUTDOWN_SIGNALS: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];

export const createServer = (params: CreateServerParams): NodeServer => {
    const host = params.host ?? DEFAULT_HOST;
    const port = params.port ?? DEFAULT_PORT;
    const gracefulShutdown = params.gracefulShutdown ?? true;
    const healthCheckPath = params.healthCheckPath ?? DEFAULT_HEALTH_PATH;

    // Build a fresh container so we don't mutate the caller's input.
    const plugins = new PluginsContainer([]);
    if (params.plugins) {
        plugins.merge(params.plugins);
    }
    plugins.register(createHealthRoutePlugin(healthCheckPath));

    const app = createBaseHandler({
        plugins,
        options: {
            logger: params.options?.logger ?? { level: "info" },
            ...(params.options || {})
        },
        debug: params.debug
    });

    let boundAddress: string | undefined;
    let closing: Promise<void> | undefined;
    let signalHandlersInstalled = false;

    const close = async (): Promise<void> => {
        if (closing) {
            return closing;
        }
        closing = (async () => {
            await app.close();
        })();
        return closing;
    };

    const installSignalHandlers = () => {
        if (signalHandlersInstalled) {
            return;
        }
        signalHandlersInstalled = true;
        for (const signal of SHUTDOWN_SIGNALS) {
            process.once(signal, () => {
                close()
                    .then(() => process.exit(0))
                    .catch(err => {
                        console.error("Error during graceful shutdown:", err);
                        process.exit(1);
                    });
            });
        }
    };

    const listen = async (): Promise<string> => {
        boundAddress = await app.listen({ host, port });
        if (gracefulShutdown) {
            installSignalHandlers();
        }
        return boundAddress;
    };

    const address = (): string => {
        if (!boundAddress) {
            throw new Error("Server has not been started yet. Call `listen()` first.");
        }
        return boundAddress;
    };

    return { app, listen, close, address };
};
