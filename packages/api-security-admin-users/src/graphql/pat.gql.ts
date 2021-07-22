import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import {
    AdminUsersContext,
    CreatePersonalAccessTokenInput,
    UpdatePersonalAccessTokenInput,
    User
} from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

export default new GraphQLSchemaPlugin<AdminUsersContext>({
    typeDefs: /* GraphQL */ `
        type SecurityPersonalAccessToken {
            id: ID
            name: String
            token: String
            createdOn: DateTime
        }
        input SecurityPersonalAccessTokenInput {
            name: String
        }

        type SecurityPersonalAccessTokenCreate {
            pat: SecurityPersonalAccessToken
            # The full token - you only receive it once!
            token: String
        }

        type SecurityPersonalAccessTokenCreateResponse {
            data: SecurityPersonalAccessTokenCreate
            error: SecurityError
        }

        type SecurityPersonalAccessTokenResponse {
            data: SecurityPersonalAccessToken
            error: SecurityError
        }

        extend type SecurityUser {
            personalAccessTokens: [SecurityPersonalAccessToken]
        }

        extend type SecurityMutation {
            createPAT(
                data: SecurityPersonalAccessTokenInput!
            ): SecurityPersonalAccessTokenCreateResponse

            updatePAT(
                id: ID!
                data: SecurityPersonalAccessTokenInput!
            ): SecurityPersonalAccessTokenResponse

            deletePAT(id: ID!): SecurityBooleanResponse
        }
    `,
    resolvers: {
        SecurityUser: {
            personalAccessTokens(user: User, args, context) {
                // A user can only access his own tokens!
                if (user.login !== context.security.getIdentity().id) {
                    return null;
                }

                return context.security.users.listTokens(user.login);
            }
        },
        SecurityPersonalAccessToken: {
            token: pat => {
                return pat.token.substr(-4);
            }
        },
        SecurityMutation: {
            createPAT: async (
                root,
                { data }: { data: CreatePersonalAccessTokenInput },
                context
            ) => {
                try {
                    const pat = await context.security.users.createToken(data);

                    return new Response({
                        pat,
                        token: pat.token
                    });
                } catch (ex) {
                    return new ErrorResponse({
                        code: ex.code,
                        message: ex.message,
                        data: ex.data || null
                    });
                }
            },
            updatePAT: async (
                root,
                { id, data }: { id: string; data: UpdatePersonalAccessTokenInput },
                context
            ) => {
                try {
                    const token = await context.security.users.updateToken(id, data);

                    return new Response(token);
                } catch (ex) {
                    return new ErrorResponse({
                        code: ex.code,
                        message: ex.message,
                        data: ex.data || null
                    });
                }
            },
            deletePAT: async (root, { id }, context) => {
                try {
                    await context.security.users.deleteToken(id);

                    return new Response(true);
                } catch (ex) {
                    return new ErrorResponse({
                        code: ex.code,
                        message: ex.message,
                        data: ex.data || null
                    });
                }
            }
        }
    }
});
