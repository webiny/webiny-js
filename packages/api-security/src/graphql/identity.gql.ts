import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import type { SecurityContext } from "~/types.js";
import type { TenancyContext } from "@webiny/api-tenancy/types.js";
import { EventPublisher } from "@webiny/api-core";
import { AfterLoginEvent } from "~/features/login/index.js";

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
                        const eventPublisher = context.container.resolve(EventPublisher);
                        await eventPublisher.publish(new AfterLoginEvent({ identity }));
                    } catch (err) {
                        return new ErrorResponse(err);
                    }
                }
                return new Response(identity);
            }
        }
    }
});
