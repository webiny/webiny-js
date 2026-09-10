import { GraphQLContextualSchema } from "@webiny/api-graphql";
import type { IGraphQLContextualSchema } from "@webiny/api-graphql";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { getSchema } from "~/graphql/getSchema.js";
import { HeadlessCmsEndpointConfig } from "~/HeadlessCmsEndpointConfig.js";
import type { IHeadlessCmsEndpointConfig } from "~/HeadlessCmsEndpointConfig.js";
import type { CmsContext } from "~/types/index.js";
import type { GraphQLSchema } from "graphql";

class HeadlessCmsContextualSchemaImpl implements IGraphQLContextualSchema {
    constructor(
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private config: IHeadlessCmsEndpointConfig
    ) {}

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        const cmsCtx = ctx as CmsContext;
        const getTenant = () => this.tenantContext.getTenant();

        return this.identityContext.withoutAuthorization(() => {
            return getSchema({ context: cmsCtx, getTenant, type: this.config.type });
        });
    }
}

export const HeadlessCmsContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: HeadlessCmsContextualSchemaImpl,
    dependencies: [TenantContext, IdentityContext, HeadlessCmsEndpointConfig]
});
