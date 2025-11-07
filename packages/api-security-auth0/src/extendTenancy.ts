import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";
import { ContextPlugin } from "@webiny/handler";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export const extendTenancy = () => {
    return new ContextPlugin<ApiCoreContext>(ctx => {
        if (ctx.wcp.canUseFeature("multiTenancy")) {
            // We can have different "appClientId" for each tenant.
            // This plugin adds the GraphQL fields to allow per-tenant appClientId storage.
            ctx.plugins.register(
                new GraphQLSchemaPlugin<ApiCoreContext>({
                    typeDefs: /* GraphQL */ `
                        extend type TenancyQuery {
                            appClientId: String
                        }
                    `,
                    resolvers: {
                        TenancyQuery: {
                            appClientId(_, __, context) {
                                const tenant = context.tenancy.getCurrentTenant();
                                return tenant.settings.appClientId;
                            }
                        }
                    }
                })
            );
        }
    });
};
