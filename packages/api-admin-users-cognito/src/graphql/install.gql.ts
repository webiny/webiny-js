import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { AdminUsersContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { SecurityContext } from "@webiny/api-security/types";

type Context = SecurityContext & AdminUsersContext;

export default new GraphQLSchemaPlugin<Context>({
    typeDefs: /* GraphQL */ `
        input AdminUsersInstallInput {
            firstName: String!
            lastName: String!
            email: String!
            password: String!
        }

        extend type AdminUsersQuery {
            "Get installed version"
            version: String
        }

        extend type AdminUsersMutation {
            "Install Admin Users"
            install(data: AdminUsersInstallInput!): AdminUsersBooleanResponse
        }
    `,
    resolvers: {
        AdminUsersQuery: {
            version: async (_, __, context) => {
                return await context.adminUsers.getVersion();
            }
        },
        AdminUsersMutation: {
            install: async (_, args, context) => {
                try {
                    context.security.disableAuthorization();
                    await context.adminUsers.install(args.data);
                    context.security.enableAuthorization();
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
