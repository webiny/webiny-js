import type { Container } from "@webiny/di";
import { Abstraction } from "@webiny/di";
import type { IGraphQLContextInitializer } from "@webiny/handler-graphql";
import {
    CmsContext as CmsContextAbstraction,
    StorageOperations,
    StorageOperationsFactory
} from "~/features/shared/abstractions.js";
import type { ApiEndpoint, CmsContext } from "~/types/index.js";

export interface IHeadlessCmsEnhancerConfig {
    type: ApiEndpoint;
    extraPlugins?: any[];
}

export const HeadlessCmsEnhancerConfig = new Abstraction<IHeadlessCmsEnhancerConfig>(
    "HeadlessCmsEnhancerConfig"
);

/**
 * Per-request setup that cannot be expressed as a synchronous DI factory.
 *
 * The HeadlessCms facade itself (and AccessControl, export/import) are now LAZY DI factories built
 * on first resolve — see HeadlessCmsFeature.register. The only things that must still run eagerly,
 * per request, before resolvers are:
 *
 * 1. Building the storage operations — `StorageOperationsFactory.create()` / `beforeInit()` are
 *    async, and DI factories resolve synchronously, so the facade can't build them on demand.
 * 2. Applying any ContextPlugin instances supplied via `extraPlugins` (their `apply()` is async).
 * 3. Seeding `ctx.plugins` / `ctx.benchmark` on the shared request context for the other (still
 *    ordered) GraphQLContextInitializers and contextual schemas that read them off `ctx`.
 *
 * Everything else moved to register() (pure, synchronous wiring).
 */
export class HeadlessCmsInitializerImpl implements IGraphQLContextInitializer {
    private initialized = false;

    constructor(private container: Container) {}

    async init(ctx: Record<string, any>): Promise<void> {
        const cmsContext = this.container.resolve(CmsContextAbstraction) as CmsContext;

        // Share the plugins container + benchmark with downstream initializers / contextual schemas
        // that still read them off the request context object.
        ctx.plugins = cmsContext.plugins;
        ctx.benchmark = cmsContext.benchmark;

        if (this.initialized) {
            return;
        }
        this.initialized = true;

        const storageOperations = await this.container
            .resolve(StorageOperationsFactory)
            .create(cmsContext);
        await storageOperations.beforeInit(cmsContext);
        this.container.registerInstance(StorageOperations, storageOperations);
        if (storageOperations.init) {
            await storageOperations.init(cmsContext);
        }

        // Apply ContextPlugin instances from extraPlugins (they may register event handlers etc.)
        const config = this.container.resolve(HeadlessCmsEnhancerConfig);
        for (const plugin of config.extraPlugins ?? []) {
            if (plugin && typeof plugin.apply === "function") {
                await plugin.apply(ctx);
            }
        }
    }
}
