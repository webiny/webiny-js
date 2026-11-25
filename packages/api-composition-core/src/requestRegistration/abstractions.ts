import type { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/api";

export interface IApiRequestRegistration {
    /**
     * Registers what a request has into `container`, exactly as the transport does for every request
     * (its `child` step): the storages (every `RequestStorage`), the API's features with the
     * transport's adapters, and the project's extensions.
     */
    register(container: Container): Promise<void>;
}

/**
 * The transport's request registration, in the root container. Lets work that runs outside any
 * request build a container a request would have: the SQL schema setup builds one on its own
 * connection, so it sets up the tables of exactly the storages and modules the API runs.
 */
export const ApiRequestRegistration = createAbstraction<IApiRequestRegistration>(
    "Core/ApiRequestRegistration"
);

export namespace ApiRequestRegistration {
    export type Interface = IApiRequestRegistration;
}
