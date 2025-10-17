import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";
import type { SecurityIdentity } from "@webiny/api-security/types.js";
import { ContextPlugin } from "@webiny/api";
import type { TenancyContext } from "@webiny/api-tenancy/types.js";

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
        new ContextPlugin<TenancyContext>(context => {
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
