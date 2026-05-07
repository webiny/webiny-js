import { RoutePlugin } from "@webiny/handler";
import type { RouteMethodPath } from "@webiny/handler/types.js";

/**
 * Registers a simple GET health-check route at the configured path. Used by
 * container orchestrators (Docker, Kubernetes) to determine readiness.
 */
export const createHealthRoutePlugin = (path: RouteMethodPath): RoutePlugin => {
    return new RoutePlugin(({ onGet }) => {
        onGet(path, async (_, reply) => {
            return reply.code(200).send({ status: "ok" });
        });
    });
};
