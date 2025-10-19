import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";
import type { TenancyContext } from "@webiny/api-tenancy/types.js";
import { ContextPlugin } from "@webiny/handler";

export const extendTenancy = () => {
    return new ContextPlugin<TenancyContext>(ctx => {
        if (ctx.wcp.canUseFeature("multiTenancy")) {
            // We can have different "appClientId" for each tenant.
            // This plugin adds the GraphQL fields to allow per-tenant appClientId storage.
            ctx.plugins.register(
                new GraphQLSchemaPlugin<TenancyContext>({
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
