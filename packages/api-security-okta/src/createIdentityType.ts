import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";
import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

interface Config {
    name: string;
    identityType: string;
}

export const createIdentityType = (config: Config) => {
    return [
        new GraphQLSchemaPlugin({
            typeDefs: `
            type ${config.name} implements SecurityIdentity {
                id: ID!
                type: String!
                displayName: String!
                permissions: [JSON!]!
                currentTenant: Tenant
                defaultTenant: Tenant
            }
        `,
            resolvers: {
                [config.name]: {
                    __isTypeOf(obj: SecurityIdentity) {
                        return obj.type === config.identityType;
                    }
                }
            }
        }),
        new ContextPlugin<ApiCoreContext>(context => {
            const multiTenancy = context.wcp.canUseFeature("multiTenancy");
            if (multiTenancy) {
                context.plugins.register(
                    new GraphQLSchemaPlugin({
                        typeDefs: `
                            extend type ${config.name} {
                                currentTenant: Tenant
                                defaultTenant: Tenant
                            }
                        `
                    })
                );
            }
        })
    ];
};
