import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import type { SecurityContext } from "~/types";
import type { GenericRecord } from "@webiny/api/types";

export const defaultIdentity = () => {
    return new GraphQLSchemaPlugin<SecurityContext>({
        typeDefs: /* GraphQL */ `
            type Admin implements SecurityIdentity {
                id: ID!
                type: String!
                displayName: String!
                permissions: [JSON!]!
                tenant: Tenant
                defaultTenant: Tenant
                currentTenant: Tenant
            }
        `,
        resolvers: {
            Admin: {
                __isTypeOf(obj: GenericRecord) {
                    return obj.type === "admin";
                }
            }
        }
    });
};
