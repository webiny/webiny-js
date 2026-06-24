import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { getSchema } from "~/graphql/getSchema.js";
import type { CmsContext } from "~/types/index.js";
import type { GraphQLSchema } from "graphql";

class HeadlessCmsContextualSchemaImpl implements IGraphQLContextualSchema {
    constructor(
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        const cmsCtx = ctx as CmsContext;
        const getTenant = () => this.tenantContext.getTenant();

        return this.identityContext.withoutAuthorization(() => {
            return getSchema({ context: cmsCtx, getTenant, type: cmsCtx.cms.type! });
        });
    }
}

export const HeadlessCmsContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: HeadlessCmsContextualSchemaImpl,
    dependencies: [TenantContext, IdentityContext]
});
