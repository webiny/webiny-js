import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { AdminUsersContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

export default new GraphQLSchemaPlugin<AdminUsersContext>({
    typeDefs: /* GraphQL */ `
        input AdminUsersInstallInput {
            _empty: String
        }

        extend type AdminUsersQuery {
            "Get installed version"
            version: String
        }

        extend type AdminUsersMutation {
            "Install Admin Users"
            install(data: AdminUsersInstallInput): AdminUsersBooleanResponse
        }
    `,
    resolvers: {
        AdminUsersQuery: {
            version: async (_, __, context) => {
                return await context.adminUsers.getVersion();
            }
        },
        AdminUsersMutation: {
            install: async (_, args: any, context) => {
                try {
                    await context.security.withoutAuthorization(async () => {
                        await context.adminUsers.install(args.data);
                    });
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
