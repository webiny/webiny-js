import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { SecurityContext } from "~/types";

export const defaultIdentity = () => {
    return new GraphQLSchemaPlugin<SecurityContext>({
        typeDefs: /* GraphQL */ `
            type Admin implements SecurityIdentity {
                id: ID!
                type: String!
                displayName: String!
                access: [TenantAccess!]!
            }
        `,
        resolvers: {
            Admin: {
                async access() {
                    return [{ id: "root", permissions: [{ name: "*" }] }];
                },
                __isTypeOf(obj) {
                    return obj.type === "admin";
                }
            }
        }
    });
};
