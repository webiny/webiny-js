import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { Response } from "@webiny/handler-graphql";
import { SecurityContext } from "~/types";

export default new GraphQLSchemaPlugin<SecurityContext>({
    typeDefs: /* GraphQL */ `
        type TenantAccess {
            "Tenant ID"
            id: ID!

            "Tenant name"
            name: String!

            "Tenant permissions"
            permissions: [JSON!]!
        }

        interface SecurityIdentity {
            id: ID!
            type: String!
            displayName: String!
            access: [TenantAccess!]!
        }

        type SecurityIdentityLoginResponse {
            data: SecurityIdentity
            error: SecurityError
        }

        extend type SecurityMutation {
            "Login using idToken obtained from a 3rd party identity provider"
            login: SecurityIdentityLoginResponse
        }
    `,
    resolvers: {
        SecurityMutation: {
            login: async (root, args, context) => {
                return new Response(context.security.getIdentity());
            }
        }
    }
});
