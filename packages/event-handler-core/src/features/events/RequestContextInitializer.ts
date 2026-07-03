import { Abstraction } from "@webiny/di";

/**
 * Per-request, POST-auth initialization hook. Runs after the request's tenant/identity have been
 * established (in the route, before the schema is built and before resolvers), so unlike
 * {@link RequestInitializer} (which runs pre-auth) it can do tenant/identity-dependent setup.
 *
 * Use it for per-request work that must happen before resolvers and that genuinely can't be a lazy
 * DI factory — e.g. resolving a per-tenant content model (async), registering decorators that must
 * precede the resolvers they wrap, or building a dynamic, model-derived GraphQL schema.
 *
 * - For pre-auth, tenant-agnostic per-request setup, use {@link RequestInitializer}.
 * - For tenant/identity-dependent capabilities that can be built on demand, prefer a lazy DI factory.
 *
 * It contributes no schema content; its only product is the side effect of init(ctx). Multiple
 * initializers may be registered; they run in registration order.
 *
 * NOTE: despite living in event-handler-core, the current runners are the GraphQL routes
 * (GraphQLEngine + the CMS route). Making it run for non-GraphQL transports is a separate step.
 */
export interface IRequestContextInitializer {
    init(ctx: Record<string, any>): void | Promise<void>;
}

export const RequestContextInitializer = new Abstraction<IRequestContextInitializer>(
    "RequestContextInitializer"
);

export namespace RequestContextInitializer {
    export type Interface = IRequestContextInitializer;
}
