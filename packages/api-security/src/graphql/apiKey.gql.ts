import { Response, ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { SecurityContext } from "~/types";

export default new GraphQLSchemaPlugin<SecurityContext>({
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
            async listApiKeys(_, __, context) {
                try {
                    const apiKeys = await context.security.listApiKeys();

                    return new ListResponse(apiKeys);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            async getApiKey(_, args: any, context) {
                try {
                    const apiKey = await context.security.getApiKey(args.id);

                    return new Response(apiKey);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        },
        SecurityMutation: {
            async createApiKey(_, args: any, context) {
                try {
                    const apiKey = await context.security.createApiKey(args.data);

                    return new Response(apiKey);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            async updateApiKey(_, args: any, context) {
                try {
                    const apiKey = await context.security.updateApiKey(args.id, args.data);

                    return new Response(apiKey);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            async deleteApiKey(_, args: any, context) {
                try {
                    await context.security.deleteApiKey(args.id);

                    return new Response(true);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        }
    }
});
