import type { CreateHandlerParams } from "@webiny/handler";
import type { RouteMethodPath } from "@webiny/handler/types.js";
import type { FastifyInstance } from "fastify";

export interface CreateServerParams extends CreateHandlerParams {
    /**
     * Hostname to bind. Defaults to `0.0.0.0` (all interfaces) so the server is
     * reachable from outside the container.
     */
    host?: string;
    /**
     * Port to bind. Defaults to `8080`. Use `0` to let the OS assign an
     * ephemeral port (useful in tests).
     */
    port?: number;
    /**
     * If true (default), `SIGTERM` and `SIGINT` trigger a graceful shutdown
     * that drains in-flight requests before the process exits.
     *
     * Set to `false` if the calling code wants to manage signals itself.
     */
    gracefulShutdown?: boolean;
    /**
     * Path of the health-check route. Defaults to `/health`.
     */
    healthCheckPath?: RouteMethodPath;
}

export interface NodeServer {
    /**
     * The underlying Fastify instance, for advanced use (e.g., decorating with
     * additional plugins after construction).
     */
    readonly app: FastifyInstance;
    /**
     * Start listening on the configured host/port. Resolves to the address
     * URL once the server is ready to accept connections.
     */
    listen: () => Promise<string>;
    /**
     * Close the server, draining in-flight requests. Idempotent — calling
     * twice is safe and only the first call performs cleanup.
     */
    close: () => Promise<void>;
    /**
     * Returns the bound address URL (e.g., `http://0.0.0.0:8080`). Available
     * after `listen()` resolves; throws before that.
     */
    address: () => string;
}
