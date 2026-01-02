import type { SecurityIdentity } from "@webiny/api-core/types/security.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";

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
        })
    ];
};
