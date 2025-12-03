import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";
import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export const extendTenancy = () => {
    return new ContextPlugin<ApiCoreContext>(ctx => {
        if (ctx.wcp.canUseFeature("multiTenancy")) {
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
