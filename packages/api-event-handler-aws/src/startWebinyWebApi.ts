import { createWebinyWebApiHandler } from "./createWebinyWebApiHandler.js";
import type { CreateWebinyWebApiHandlerConfig } from "./createWebinyWebApiHandler.js";

/**
 * Used when `AWS_LAMBDA_HTTP_ENDPOINT` is not set, i.e. when running the bundle outside Lambda.
 */
const DEFAULT_ENDPOINT = "127.0.0.1:3000";

/**
 * Creates the server and starts listening on the address Lambda gives in `AWS_LAMBDA_HTTP_ENDPOINT`.
 * Lambda requires the server to listen within 10 seconds of start, so the root container is NOT built
 * here; it is built on the first request. SIGTERM is handled by the server itself.
 */
export async function startWebinyWebApi(config: CreateWebinyWebApiHandlerConfig): Promise<void> {
    const endpoint = process.env.AWS_LAMBDA_HTTP_ENDPOINT || DEFAULT_ENDPOINT;
    const separator = endpoint.lastIndexOf(":");
    const hostname = endpoint.slice(0, separator);
    const portText = endpoint.slice(separator + 1);
    const port = Number(portText);

    const server = await createWebinyWebApiHandler(config);

    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, hostname, () => {
            server.off("error", reject);
            resolve();
        });
    });
}
