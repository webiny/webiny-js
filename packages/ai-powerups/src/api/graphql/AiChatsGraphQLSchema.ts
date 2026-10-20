import { resolve } from "@webiny/api-graphql";
import { ListErrorResponse } from "@webiny/api-graphql/responses.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { ListAiChatsUseCase } from "~/api/features/AiChats/ListAiChats/index.js";
import { GetAiChatUseCase } from "~/api/features/AiChats/GetAiChat/index.js";
import { SaveAiChatUseCase } from "~/api/features/AiChats/SaveAiChat/index.js";
import { DeleteAiChatUseCase } from "~/api/features/AiChats/DeleteAiChat/index.js";

const TYPE_DEFS = /* GraphQL */ `
    type AiChatSummary {
        id: ID!
        title: String!
        createdOn: DateTime!
        savedOn: DateTime!
    }

    type AiChat {
        id: ID!
        title: String!
        createdOn: DateTime!
        savedOn: DateTime!
        # The model messages, replayed verbatim to continue the chat.
        messages: JSON!
    }

    input AiChatInput {
        # Omit to start a new chat.
        id: ID
        title: String
        messages: JSON!
    }

    type AiChatListMeta {
        # Pass as \`after\` for the next page. Null on the last page.
        cursor: String
        hasMoreItems: Boolean!
    }

    type AiChatListResponse {
        data: [AiChatSummary!]
        meta: AiChatListMeta
        error: AiPowerUpsError
    }

    type AiChatResponse {
        data: AiChat
        error: AiPowerUpsError
    }

    type AiChatDeleteResponse {
        data: Boolean
        error: AiPowerUpsError
    }

    extend type AiPowerUpsQuery {
        # The current identity's chats, newest first.
        listAiChats(limit: Int, after: String): AiChatListResponse!
        getAiChat(id: ID!): AiChatResponse!
    }

    extend type AiPowerUpsMutation {
        # Creates the chat when \`data.id\` is omitted, and overwrites it otherwise.
        saveAiChat(data: AiChatInput!): AiChatResponse!
        deleteAiChat(id: ID!): AiChatDeleteResponse!
    }
`;

interface ListAiChatsArgs {
    limit?: number;
    after?: string;
}

interface SaveAiChatArgs {
    data: {
        id?: string | null;
        title?: string | null;
        messages: SaveAiChatUseCase.Input["messages"];
    };
}

class AiChatsGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("ai-powerups/AiChatsGraphQLSchemaImpl");

    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): Promise<CoreGraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(TYPE_DEFS);

        builder.addResolver<ListAiChatsArgs>({
            path: "AiPowerUpsQuery.listAiChats",
            dependencies: [ListAiChatsUseCase],
            resolver(listAiChats: ListAiChatsUseCase.Interface) {
                return async ({ args }) => {
                    const result = await listAiChats.execute({
                        limit: args.limit ?? undefined,
                        after: args.after ?? undefined
                    });
                    if (result.isFail()) {
                        return new ListErrorResponse(result.error);
                    }

                    const { items, cursor } = result.value;
                    return {
                        data: items,
                        meta: { cursor, hasMoreItems: cursor !== null },
                        error: null
                    };
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "AiPowerUpsQuery.getAiChat",
            dependencies: [GetAiChatUseCase],
            resolver(getAiChat: GetAiChatUseCase.Interface) {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await getAiChat.execute(args.id);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                };
            }
        });

        builder.addResolver<SaveAiChatArgs>({
            path: "AiPowerUpsMutation.saveAiChat",
            dependencies: [SaveAiChatUseCase],
            resolver(saveAiChat: SaveAiChatUseCase.Interface) {
                return async ({ args }) => {
                    // GraphQL clients send an unset optional field as null; the use case wants it absent.
                    const input: SaveAiChatUseCase.Input = {
                        id: args.data.id ?? undefined,
                        title: args.data.title ?? undefined,
                        messages: args.data.messages
                    };

                    return resolve(async () => {
                        const result = await saveAiChat.execute(input);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "AiPowerUpsMutation.deleteAiChat",
            dependencies: [DeleteAiChatUseCase],
            resolver(deleteAiChat: DeleteAiChatUseCase.Interface) {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await deleteAiChat.execute(args.id);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return true;
                    });
                };
            }
        });

        return builder;
    }
}

export const AiChatsGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: AiChatsGraphQLSchemaImpl,
    dependencies: []
});
