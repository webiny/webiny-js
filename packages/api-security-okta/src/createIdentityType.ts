import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { SecurityIdentity } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { TenancyContext } from "@webiny/api-tenancy/types";

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
            if (context.tenancy.isMultiTenant()) {
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
