import { Response, ErrorResponse } from "@webiny/handler-graphql/responses.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import type { ApiCoreContext } from "~/types/core.js";
import { CreateApiKeyUseCase } from "~/features/security/apiKeys/CreateApiKey/index.js";
import { UpdateApiKeyUseCase } from "~/features/security/apiKeys/UpdateApiKey/index.js";
import { DeleteApiKeyUseCase } from "~/features/security/apiKeys/DeleteApiKey/index.js";
import { ListApiKeysUseCase } from "~/features/security/apiKeys/ListApiKeys/index.js";
import { GetApiKeyUseCase } from "~/features/security/apiKeys/GetApiKey/index.js";

export default new GraphQLSchemaPlugin<ApiCoreContext>({
    typeDefs: /* GraphQL */ `
        type SecurityApiKey {
            id: ID
            name: String
            slug: String
            description: String
            token: String
            permissions: [JSON]
            createdOn: DateTime
            createdBy: SecurityCreatedBy
        }

        input SecurityApiKeyInput {
            id: ID
            name: String!
            slug: String
            description: String
            token: String
            permissions: [JSON]!
        }

        type SecurityApiKeyResponse {
            data: SecurityApiKey
            error: SecurityError
        }

        type SecurityApiKeyListResponse {
            data: [SecurityApiKey!]
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
                const list = context.container.resolve(ListApiKeysUseCase);
                const result = await list.execute();

                if (result.isOk()) {
                    return new Response(result.value);
                }
                return new ErrorResponse(result.error);
            },
            async getApiKey(_, args: any, context) {
                const getById = context.container.resolve(GetApiKeyUseCase);
                const result = await getById.execute(args.id);

                if (result.isOk()) {
                    return new Response(result.value);
                }
                return new ErrorResponse(result.error);
            }
        },
        SecurityMutation: {
            async createApiKey(_, args: any, context) {
                const createApiKey = context.container.resolve(CreateApiKeyUseCase);
                const result = await createApiKey.execute(args.data);

                if (result.isOk()) {
                    return new Response(result.value);
                }
                return new ErrorResponse(result.error);
            },
            async updateApiKey(_, args: any, context) {
                const updateApiKey = context.container.resolve(UpdateApiKeyUseCase);
                const result = await updateApiKey.execute(args.id, args.data);

                if (result.isOk()) {
                    return new Response(result.value);
                }
                return new ErrorResponse(result.error);
            },
            async deleteApiKey(_, args: any, context) {
                const deleteApiKey = context.container.resolve(DeleteApiKeyUseCase);
                const result = await deleteApiKey.execute(args.id);

                if (result.isOk()) {
                    return new Response(true);
                }
                return new ErrorResponse(result.error);
            }
        }
    }
});
