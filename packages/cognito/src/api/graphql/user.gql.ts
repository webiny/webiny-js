import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses.js";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { GetUserUseCase } from "@webiny/api-core/features/GetUser";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { CreateAdminUserUseCase } from "~/api/features/CreateAdminUser/index.js";
import { UpdateAdminUserUseCase } from "~/api/features/UpdateAdminUser/index.js";
import { DeleteAdminUserUseCase } from "~/api/features/DeleteAdminUser/index.js";

class AdminUserSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    execute(): CoreGraphQLSchemaFactory.Return {
        return [
            {
                typeDefs: this.getTypeDefs(),
                resolvers: this.getResolvers()
            }
        ];
    }

    private getTypeDefs() {
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
        `;
    }

    private getResolvers(): CoreGraphQLSchemaFactory.Resolvers<ApiCoreContext> {
        return {
            AdminUsersMutation: {
                updateCurrentUser: async (_, args: any, context) => {
                    const identityContext = context.container.resolve(IdentityContext);
                    const getUserUseCase = context.container.resolve(GetUserUseCase);
                    const updateUserUseCase = context.container.resolve(UpdateAdminUserUseCase);

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
                },
                createUser: async (_, { data }: any, context) => {
                    const createAdminUserUseCase =
                        context.container.resolve(CreateAdminUserUseCase);

                    const result = await createAdminUserUseCase.execute(data);
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
                    const updateAdminUserUseCase =
                        context.container.resolve(UpdateAdminUserUseCase);

                    const identityContext = context.container.resolve(IdentityContext);

                    if (id === identityContext.getIdentity().id) {
                        return new ErrorResponse({
                            message:
                                "You're not allowed to update your own account using this API.",
                            code: "AdminUser/GraphQL/UpdateSelf"
                        });
                    }

                    const result = await updateAdminUserUseCase.execute(id, data);
                    if (result.isFail()) {
                        return new ErrorResponse({
                            message: result.error.message,
                            code: result.error.code
                        });
                    }

                    return new Response(result.value);
                },
                deleteUser: async (_, { id }: any, context) => {
                    const deleteAdminUserUseCase =
                        context.container.resolve(DeleteAdminUserUseCase);

                    const result = await deleteAdminUserUseCase.execute(id);
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

export const AdminUsersSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: AdminUserSchemaImpl,
    dependencies: []
});
