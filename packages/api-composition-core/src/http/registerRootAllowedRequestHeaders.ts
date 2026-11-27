import type { Container } from "@webiny/di";
import { HttpAllowedRequestHeaders } from "@webiny/api-kernel-core";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ApiRequestRegistration } from "~/requestRegistration/index.js";

export class AllowedRequestHeadersError extends Error {
    constructor(cause: unknown) {
        const reason = cause instanceof Error ? cause.message : String(cause);
        super(
            [
                `Could not read the request headers the project's extensions allow in CORS (HttpAllowedRequestHeaders).`,
                `They are read once per process, at start, in a container that has a request's services but no`,
                `tenant and no identity. ${reason}`
            ].join(" "),
            { cause }
        );
        this.name = "AllowedRequestHeadersError";
    }
}

/**
 * Registers, in the root container, the request headers the project's extensions allow in the CORS
 * preflight answer (`HttpAllowedRequestHeaders`), as one list.
 *
 * `CorsHeadersDecorator` answers a preflight at request level, before any tenant scope exists, but
 * extensions register in each tenant scope, where it can't see them. The list comes from the deploy's
 * code and a preflight carries no tenant, so it is the same for every request and tenant: it is read
 * once per process, when the root container is built (a Lambda's cold start, the standalone server's
 * start).
 *
 * An extension registers everything in one callback, and may use what a request has while it
 * registers (feature flags, for one). So a throwaway child of the root gets what a request has, the
 * extensions included (`ApiRequestRegistration`), the allowed headers are read from it, and it is
 * dropped. Registration is lazy: only the allowed-headers implementations are built there, with no
 * tenant and no identity, so they must not depend on either: one that can't be built fails the start.
 *
 * A request's registration that fails there would fail every request the same way, which reports it.
 * Here it is logged as a warning, and only the headers registered before it failed are allowed.
 *
 * Call it last in the root, once `ApiRequestRegistration` and the root's services are registered.
 */
export async function registerRootAllowedRequestHeaders(root: Container): Promise<void> {
    const throwaway = root.createChildContainer();
    try {
        await root.resolve(ApiRequestRegistration).register(throwaway);
    } catch (error) {
        const [logger] = root.resolveAll(Logger);
        logger?.warn(
            { error: error instanceof Error ? error.message : String(error) },
            "[cors] Registering a request's services failed while the CORS allowed headers were read, at start. Only headers registered before the failure are allowed."
        );
    }

    let headers: string[];
    try {
        headers = throwaway.resolveAll(HttpAllowedRequestHeaders).flatMap(item => item.headers);
    } catch (error) {
        throw new AllowedRequestHeadersError(error);
    }
    root.registerInstance(HttpAllowedRequestHeaders, { headers });
}
