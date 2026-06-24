import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { createContextPlugin } from "@webiny/api";
import { InvalidateCloudfrontCacheTaskDefinition } from "@webiny/api-file-manager-s3/features/FlushCache/InvalidateCacheTask.js";
import { createWebsiteBuilder } from "~/index.js";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import { PageModelPlugin } from "~/domain/page/page.model.js";
import { RedirectModelPlugin } from "~/domain/redirect/redirect.model.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";

type Params = Omit<UseContextHandlerParams, "features"> & {
    identity?: IdentityData | null;
};

export const useHandler = (params: Params = {}) => {
    const { identity, ...rest } = params;

    const inner = useContextHandler<ApiCoreContext>({
        ...rest,
        // Do not pass null identity to useContextHandler — TenancyAndSecurityFeature
        // does not support null (treats it same as undefined → defaultIdentity).
        // We handle anonymous identity below via a second GraphQLContextEnhancer.
        identity: identity === null ? undefined : identity,
        plugins: [
            createContextPlugin(ctx => {
                ctx.container.register(InvalidateCloudfrontCacheTaskDefinition);
            }),
            createWebsiteBuilder(),
            ...[rest.plugins].flat(Infinity as 1).filter(Boolean)
        ],
        features: container => {
            container.register(PageModelPlugin);
            container.register(RedirectModelPlugin);
            LanguagesExtension.register(container);

            // When identity is explicitly null the test wants an anonymous (unauthenticated)
            // request. TenancyAndSecurityFeature always seats a non-null identity during its
            // enhance() phase; we override it back to anonymous in a second enhancer that
            // runs after TenancyAndSecurityFeature's enhancer.
            if (identity === null) {
                const anonymousOverride: IGraphQLContextEnhancer = {
                    async enhance(_ctx: Record<string, any>): Promise<void> {
                        const identityCtx = container.resolve(IdentityContext);
                        identityCtx.setIdentity(undefined);
                    }
                };
                container.registerInstance(GraphQLContextEnhancer, anonymousOverride);
            }
        }
    });

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        elasticsearch: createTestOpenSearchClient(),
        handler: inner.context
    };
};
