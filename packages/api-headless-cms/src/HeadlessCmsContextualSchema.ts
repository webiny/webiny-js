import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import { getSchema } from "~/graphql/getSchema.js";
import type { CmsContext } from "~/types/index.js";
import type { GraphQLSchema } from "graphql";

class HeadlessCmsContextualSchemaImpl implements IGraphQLContextualSchema {
    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        const cmsCtx = ctx as CmsContext;
        const getTenant = () => cmsCtx.tenancy.getCurrentTenant();

        return cmsCtx.security.withoutAuthorization(() => {
            return getSchema({ context: cmsCtx, getTenant, type: cmsCtx.cms.type });
        });
    }
}

export const HeadlessCmsContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: HeadlessCmsContextualSchemaImpl,
    dependencies: []
});
