import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { SecurityContext } from "~/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

type Context = SecurityContext & TenancyContext;

export default new GraphQLSchemaPlugin<Context>({
    typeDefs: /* GraphQL */ `
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
            permissions(_, __, context) {
                return context.security.listPermissions();
            }
        },
        SecurityMutation: {
            login: async (_, __, context) => {
                const identity = context.security.getIdentity();
                if (identity) {
                    try {
                        await context.security.onBeforeLogin.publish({ identity });
                        await context.security.onLogin.publish({ identity });
                        await context.security.onAfterLogin.publish({ identity });
                    } catch (err) {
                        return new ErrorResponse(err);
                    }
                }
                return new Response(identity);
            }
        }
    }
});
