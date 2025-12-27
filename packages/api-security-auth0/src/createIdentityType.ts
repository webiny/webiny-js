import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

interface Config {
    name: string;
    identityType: string;
}

export const createIdentityType = (config: Config) => {
    return [
        // Webiny supports different identity types, so we need to define a dedicated GraphQL type
        // for each identity type in the system. They all must implement the base `SecurityIdentity` interface.
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
