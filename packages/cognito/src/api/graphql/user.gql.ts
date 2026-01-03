import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses.js";
import { GraphQLSchema } from "@webiny/handler-graphql/graphql/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { GetUserUseCase } from "@webiny/api-core/features/GetUser";
import { CreateUserUseCase } from "@webiny/api-core/features/CreateUser";
import { UpdateUserUseCase } from "@webiny/api-core/features/UpdateUser";
import { DeleteUserUseCase } from "@webiny/api-core/features/DeleteUser";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";

class AdminUserSchemaImpl implements GraphQLSchema.Interface {
    getTypeDefs(): GraphQLSchema.GetTypeDefsReturn {
        return /* GraphQL */ `
            """
            This input type is used by administrators to create other user's accounts within the same tenant.
            """
            input AdminUsersCreateInput {
                email: String!
                firstName: String!
                lastName: String!
                password: String!
                avatar: JSON
                groups: [RefInput!]
                teams: [RefInput!]
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
                groups: [RefInput!]
                teams: [RefInput!]
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
        `;
    }

    getResolvers(): GraphQLSchema.GetResolversReturn {
        return {
            AdminUsersMutation: {
                updateCurrentUser: async (_, args: any, context) => {
                    const identityContext = context.container.resolve(IdentityContext);
                    const getUserUseCase = context.container.resolve(GetUserUseCase);
                    const updateUserUseCase = context.container.resolve(UpdateUserUseCase);

                    const identity = identityContext.getIdentity();
                    if (identity.isAnonymous()) {
                        return new NotAuthorizedResponse();
                    }

                    // Current user might not have permissions for `adminUsers`.
                    return await identityContext.withoutAuthorization(async () => {
                        const getUserResult = await getUserUseCase.execute({ id: identity.id });
                        if (getUserResult.isFail()) {
                            // TODO: check if current identity belongs to a different tenant.
                            // TODO: If so, switch to that other tenant, and update his profile there.
                            return new NotFoundResponse("User not found!");
                        }

                        const user = getUserResult.value;

                        const updateResult = await updateUserUseCase.execute(user.id, args.data);
                        if (updateResult.isFail()) {
                            return new ErrorResponse({
                                message: updateResult.error.message,
                                code: updateResult.error.code,
                                data: updateResult.error.data
                            });
                        }

                        return new Response(updateResult.value);
                    });
                },
                createUser: async (_, { data }: any, context) => {
                    const createUserUseCase = context.container.resolve(CreateUserUseCase);

                    const result = await createUserUseCase.execute(data);
                    if (result.isFail()) {
                        return new ErrorResponse({
                            message: result.error.message,
                            code: result.error.code,
                            data: result.error.data
                        });
                    }

                    return new Response(result.value);
                },
                updateUser: async (_, { data, id }: any, context) => {
                    const updateUserUseCase = context.container.resolve(UpdateUserUseCase);

                    const result = await updateUserUseCase.execute(id, data);
                    if (result.isFail()) {
                        return new ErrorResponse({
                            message: result.error.message,
                            code: result.error.code
                        });
                    }

                    return new Response(result.value);
                },
                deleteUser: async (_, { id }: any, context) => {
                    const deleteUserUseCase = context.container.resolve(DeleteUserUseCase);

                    const result = await deleteUserUseCase.execute(id);
                    if (result.isFail()) {
                        return new ErrorResponse({
                            message: result.error.message,
                            code: result.error.code,
                            data: result.error.data
                        });
                    }

                    return new Response(true);
                }
            }
        };
    }
}

export const AdminUsersSchema = GraphQLSchema.createImplementation({
    implementation: AdminUserSchemaImpl,
    dependencies: []
});
