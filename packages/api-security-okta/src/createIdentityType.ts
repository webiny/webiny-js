import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { SecurityIdentity } from "@webiny/api-security/types";

interface Config {
    name: string;
    identityType: string;
}

export const createIdentityType = (config: Config) => {
    return new GraphQLSchemaPlugin({
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
    });
};
