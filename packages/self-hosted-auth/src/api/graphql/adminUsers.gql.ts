import { ErrorResponse, NotFoundResponse, Response } from "@webiny/api-graphql/responses.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import { CreateAdminUserUseCase } from "~/api/features/CreateAdminUser/index.js";
import { UpdateAdminUserUseCase } from "~/api/features/UpdateAdminUser/index.js";
import { DeleteAdminUserUseCase } from "~/api/features/DeleteAdminUser/index.js";

/**
 * The admin user mutations, with the same types and fields `@webiny/cognito` exposes. The admin
 * app's Users and Account screens speak this contract and do not know which identity provider
 * answers it.
 */
class SelfHostedAdminUsersSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("self-hosted-auth/SelfHostedAdminUsersSchemaImpl");

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
            This input type is used by the user who is updating their own account.
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
            dependencies: [IdentityContext, GetUserUseCase, UpdateAdminUserUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                getUser: GetUserUseCase.Interface,
                updateUser: UpdateAdminUserUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const identity = identityContext.getIdentity();
                    if (!identity.isAdmin()) {
                        return new NotAuthorizedResponse();
                    }

                    // Changing your own account does not take `adminUsers` permissions. The input
                    // type is what keeps roles and teams out of reach here.
                    return await identityContext.withoutAuthorization(async () => {
                        const found = await getUser.execute({ id: identity.id });
                        if (found.isFail()) {
                            return new NotFoundResponse("User not found!");
                        }

                        const result = await updateUser.execute(found.value.id, args.data);
                        if (result.isFail()) {
                            return new ErrorResponse({
                                message: result.error.message,
                                code: result.error.code,
                                data: result.error.data
                            });
                        }

                        return new Response(result.value);
                    });
                };
            }
        });

        builder.addResolver({
            path: "AdminUsersMutation.createUser",
            dependencies: [CreateAdminUserUseCase],
            resolver: (createUser: CreateAdminUserUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await createUser.execute(args.data);
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
            dependencies: [UpdateAdminUserUseCase, IdentityContext],
            resolver: (
                updateUser: UpdateAdminUserUseCase.Interface,
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

                    const result = await updateUser.execute(args.id, args.data);
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
            path: "AdminUsersMutation.deleteUser",
            dependencies: [DeleteAdminUserUseCase],
            resolver: (deleteUser: DeleteAdminUserUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await deleteUser.execute(args.id);
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

export const SelfHostedAdminUsersSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: SelfHostedAdminUsersSchemaImpl,
    dependencies: []
});
