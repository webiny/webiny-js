import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses";
import { AdminUsersContext } from "@webiny/api-admin-users/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

export interface CreateUserGraphQlPluginsParams {
    teams?: boolean;
}

export default (params: CreateUserGraphQlPluginsParams) => {
    return [
        new GraphQLSchemaPlugin<AdminUsersContext>({
            typeDefs: /* GraphQL */ `
                """
                This input type is used by administrators to create other user's accounts within the same tenant.
                """
                input AdminUsersCreateInput {
                    email: String!
                    firstName: String!
                    lastName: String!
                    password: String!
                    avatar: JSON
                    ${params.teams ? "groups: [RefInput]" : "groups: [RefInput!]"}
                }

                """
                This input type is used by administrators to update other user's accounts within the same tenant.
                """
                input AdminUsersUpdateInput {
                    email: String
                    firstName: String
                    lastName: String
                    password: String
                    avatar: JSON
                    groups: [RefInput]
                }

                """
                This input type is used by the user who is updating his own account
                """
                input AdminUsersCurrentUserInput {
                    email: String
                    firstName: String
                    lastName: String
                    password: String
                    avatar: JSON
                }

                extend type AdminUsersMutation {
                    updateCurrentUser(data: AdminUsersCurrentUserInput!): AdminUsersResponse

                    createUser(data: AdminUsersCreateInput!): AdminUsersResponse

                    updateUser(id: ID!, data: AdminUsersUpdateInput!): AdminUsersResponse

                    deleteUser(id: ID!): AdminUsersBooleanResponse
                }
            `,
            resolvers: {
                AdminUsersMutation: {
                    updateCurrentUser: async (_, args: any, context) => {
                        const { security, adminUsers } = context;
                        const identity = security.getIdentity();
                        if (!identity) {
                            throw new Error("Not authorized!");
                        }

                        // Current user might not have permissions for `adminUsers`.

                        return await context.security.withoutAuthorization(async () => {
                            let user = await adminUsers.getUser({ where: { id: identity.id } });
                            if (!user) {
                                // TODO: check if current identity belongs to a different tenant.
                                // TODO: If so, switch to that other tenant, and update his profile there.
                                return new NotFoundResponse("User not found!");
                            }

                            try {
                                user = await adminUsers.updateUser(user.id, args.data);

                                // Now we can re-enable authorization.

                                return new Response(user);
                            } catch (ex) {
                                return new ErrorResponse(ex);
                            }
                        });
                    },
                    createUser: async (_, { data }: any, context) => {
                        try {
                            const user = await context.adminUsers.createUser(data);

                            return new Response(user);
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    },
                    updateUser: async (_, { data, id }: any, { adminUsers }) => {
                        try {
                            const user = await adminUsers.updateUser(id, data);

                            return new Response(user);
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    },
                    deleteUser: async (_, { id }: any, context) => {
                        try {
                            await context.adminUsers.deleteUser(id);

                            return new Response(true);
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    }
                }
            }
        }),
        params.teams &&
            new GraphQLSchemaPlugin<AdminUsersContext>({
                typeDefs: /* GraphQL */ `
                    extend input AdminUsersCreateInput {
                        teams: [RefInput]
                    }

                    extend input AdminUsersUpdateInput {
                        teams: [RefInput]
                    }
                `
            })
    ].filter(Boolean);
};
