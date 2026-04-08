import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses.js";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import { CreateUserUseCase } from "~/api/features/CreateUser/index.js";
import { UpdateUserUseCase } from "~/api/features/UpdateUser/index.js";
import { DeleteUserUseCase } from "~/api/features/DeleteUser/index.js";

class AdminUserSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            """
            This input type is used by administrators to create other user's accounts within the same tenant.
            """
            input AdminUsersCreateInput {
                email: String!
                firstName: String!
                lastName: String!
                password: String!
                avatar: JSON
                roles: [RefInput!]
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
                roles: [RefInput!]
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
        `);

        builder.addResolver({
            path: "AdminUsersMutation.updateCurrentUser",
            dependencies: [IdentityContext, GetUserUseCase, UpdateUserUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                getUserUseCase: GetUserUseCase.Interface,
                updateUserUseCase: UpdateUserUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const identity = identityContext.getIdentity();
                    if (!identity.isAdmin()) {
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

                        // TODO: UpdateCurrentUser should be a dedicated use case
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
                };
            }
        });

        builder.addResolver({
            path: "AdminUsersMutation.createUser",
            dependencies: [CreateUserUseCase],
            resolver: (createUserUseCase: CreateUserUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await createUserUseCase.execute(args.data);
                    if (result.isFail()) {
                        return new ErrorResponse({
                            message: result.error.message,
                            code: result.error.code,
                            data: result.error.data
                        });
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "AdminUsersMutation.updateUser",
            dependencies: [UpdateUserUseCase, IdentityContext],
            resolver: (
                updateUserUseCase: UpdateUserUseCase.Interface,
                identityContext: IdentityContext.Interface
            ) => {
                return async ({ args }) => {
                    if (args.id === identityContext.getIdentity().id) {
                        return new ErrorResponse({
                            message:
                                "You're not allowed to update your own account using this API.",
                            code: "AdminUser/GraphQL/UpdateSelf"
                        });
                    }

                    const result = await updateUserUseCase.execute(args.id, args.data);
                    if (result.isFail()) {
                        return new ErrorResponse({
                            message: result.error.message,
                            code: result.error.code
                        });
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "AdminUsersMutation.deleteUser",
            dependencies: [DeleteUserUseCase],
            resolver: (deleteUserUseCase: DeleteUserUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await deleteUserUseCase.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse({
                            message: result.error.message,
                            code: result.error.code,
                            data: result.error.data
                        });
                    }

                    return new Response(true);
                };
            }
        });

        return builder;
    }
}

export const AdminUsersSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: AdminUserSchemaImpl,
    dependencies: []
});
