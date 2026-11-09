import { handleShutdownSignals } from "@webiny/event-handler-standalone";
import { createWebinyWebApiHandler } from "./createWebinyWebApiHandler.js";
import type { CreateWebinyWebApiHandlerConfig } from "./createWebinyWebApiHandler.js";

/**
 * Used when `AWS_LAMBDA_HTTP_ENDPOINT` is not set, i.e. when running the bundle outside Lambda.
 */
const DEFAULT_ENDPOINT = "127.0.0.1:3000";

/**
 * Creates the server and starts listening on the address Lambda gives in `AWS_LAMBDA_HTTP_ENDPOINT`.
 * Lambda requires the server to listen within 10 seconds of start, so the root container is NOT built
 * here; it is built on the first request.
 */
export async function startWebinyWebApi(config: CreateWebinyWebApiHandlerConfig): Promise<void> {
    const endpoint = process.env.AWS_LAMBDA_HTTP_ENDPOINT || DEFAULT_ENDPOINT;
    const separator = endpoint.lastIndexOf(":");
    const hostname = endpoint.slice(0, separator);
    const port = Number(endpoint.slice(separator + 1));

    const server = await createWebinyWebApiHandler(config);

    // Lambda sends SIGTERM before it shuts an environment down. This closes the idle keep-alive
    // connections Lambda holds, lets busy ones finish, and exits within a bounded time. Nothing to
    // clean up beyond that, so `shutdown` doesn't touch the root container, which may not exist yet.
    handleShutdownSignals({
        server,
        shutdown: async () => {}
    });

    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, hostname, () => {
            server.off("error", reject);
            resolve();
        });
    });
}
