import { Response, ErrorResponse } from "@webiny/handler-graphql/responses.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { CreateApiKeyUseCase } from "~/features/security/apiKeys/CreateApiKey/index.js";
import { UpdateApiKeyUseCase } from "~/features/security/apiKeys/UpdateApiKey/index.js";
import { DeleteApiKeyUseCase } from "~/features/security/apiKeys/DeleteApiKey/index.js";
import { ListApiKeysUseCase } from "~/features/security/apiKeys/ListApiKeys/index.js";
import { GetApiKeyUseCase } from "~/features/security/apiKeys/GetApiKey/index.js";

export const addApiKeySchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(/* GraphQL */ `
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
    `);

    builder.addResolver({
        path: "SecurityQuery.listApiKeys",
        dependencies: [ListApiKeysUseCase],
        resolver: (list: ListApiKeysUseCase.Interface) => async () => {
            const result = await list.execute();

            if (result.isOk()) {
                return new Response(result.value);
            }
            return new ErrorResponse(result.error);
        }
    });

    builder.addResolver<{ id: string }>({
        path: "SecurityQuery.getApiKey",
        dependencies: [GetApiKeyUseCase],
        resolver:
            (getById: GetApiKeyUseCase.Interface) =>
            async ({ args }) => {
                const result = await getById.execute(args.id);

                if (result.isOk()) {
                    return new Response(result.value);
                }
                return new ErrorResponse(result.error);
            }
    });

    builder.addResolver<{ data: any }>({
        path: "SecurityMutation.createApiKey",
        dependencies: [CreateApiKeyUseCase],
        resolver:
            (createApiKey: CreateApiKeyUseCase.Interface) =>
            async ({ args }) => {
                const result = await createApiKey.execute(args.data);

                if (result.isOk()) {
                    return new Response(result.value);
                }
                return new ErrorResponse(result.error);
            }
    });

    builder.addResolver<{ id: string; data: any }>({
        path: "SecurityMutation.updateApiKey",
        dependencies: [UpdateApiKeyUseCase],
        resolver:
            (updateApiKey: UpdateApiKeyUseCase.Interface) =>
            async ({ args }) => {
                const result = await updateApiKey.execute(args.id, args.data);

                if (result.isOk()) {
                    return new Response(result.value);
                }
                return new ErrorResponse(result.error);
            }
    });

    builder.addResolver<{ id: string }>({
        path: "SecurityMutation.deleteApiKey",
        dependencies: [DeleteApiKeyUseCase],
        resolver:
            (deleteApiKey: DeleteApiKeyUseCase.Interface) =>
            async ({ args }) => {
                const result = await deleteApiKey.execute(args.id);

                if (result.isOk()) {
                    return new Response(true);
                }
                return new ErrorResponse(result.error);
            }
    });
};
