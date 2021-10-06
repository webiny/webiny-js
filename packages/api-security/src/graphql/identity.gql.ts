import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { Response } from "@webiny/handler-graphql";
import { SecurityContext } from "~/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

type Context = SecurityContext & TenancyContext;

export default new GraphQLSchemaPlugin<Context>({
    typeDefs: /* GraphQL */ `
        interface SecurityIdentity {
            id: ID!
            type: String!
            displayName: String!
            permissions: [JSON!]!
            tenant: Tenant
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
        SecurityIdentity: {
            permissions(identity, args, context) {
                return context.security.getPermissions();
            },
            tenant(_, args, context) {
                return context.tenancy.getCurrentTenant();
            }
        },
        SecurityMutation: {
            login: async (root, args, context) => {
                const identity = context.security.getIdentity();
                if (identity) {
                    await context.security.onBeforeLogin.publish({ identity });
                    await context.security.onLogin.publish({ identity });
                    await context.security.onAfterLogin.publish({ identity });
                }
                return new Response(identity);
            }
        }
    }
});
