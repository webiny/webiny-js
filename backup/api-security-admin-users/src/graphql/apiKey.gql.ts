import { Response, ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { AdminUsersContext, ApiKeyInput } from "~/types";

export default new GraphQLSchemaPlugin<AdminUsersContext>({
    typeDefs: /* GraphQL */ `
        type SecurityApiKey {
            id: ID
            name: String
            description: String
            token: String
            permissions: [JSON]
            createdOn: DateTime
            createdBy: SecurityCreatedBy
        }

        input SecurityApiKeyInput {
            name: String!
            description: String
            permissions: [JSON]!
        }

        type SecurityApiKeyResponse {
            data: SecurityApiKey
            error: SecurityError
        }

        type SecurityApiKeyListResponse {
            data: [SecurityApiKey]
            error: SecurityError
        }

        extend type SecurityQuery {
            listApiKeys: SecurityApiKeyListResponse
            getApiKey(id: ID!): SecurityApiKeyResponse
        }

        extend type SecurityMutation {
            createApiKey(data: SecurityApiKeyInput!): SecurityApiKeyResponse
            updateApiKey(id: ID!, data: SecurityApiKeyInput!): SecurityApiKeyResponse
            deleteApiKey(id: ID!): SecurityBooleanResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            async listApiKeys(_, args, context) {
                try {
                    const apiKeys = await context.security.apiKeys.listApiKeys();

                    return new ListResponse(apiKeys);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            async getApiKey(_, args: { id: string }, context) {
                try {
                    const apiKey = await context.security.apiKeys.getApiKey(args.id);

                    return new Response(apiKey);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        },
        SecurityMutation: {
            async createApiKey(_, args: { data: ApiKeyInput }, context) {
                try {
                    const apiKey = await context.security.apiKeys.createApiKey(args.data);

                    return new Response(apiKey);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            async updateApiKey(_, args: { id: string; data: ApiKeyInput }, context) {
                try {
                    const apiKey = await context.security.apiKeys.updateApiKey(args.id, args.data);

                    return new Response(apiKey);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            async deleteApiKey(_, args: { id: string }, context) {
                try {
                    await context.security.apiKeys.deleteApiKey(args.id);

                    return new Response(true);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        }
    }
});
