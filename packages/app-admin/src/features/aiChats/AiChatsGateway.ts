import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { AiChatsGateway as GatewayAbstraction } from "./abstractions.js";
import type { AiChat } from "./abstractions.js";
import type { AiChatSummary } from "./abstractions.js";
import type { AiChatsPage } from "./abstractions.js";
import type { SaveAiChatInput } from "./abstractions.js";

const ERROR_FIELDS = /* GraphQL */ `
    error {
        code
        message
    }
`;

const LIST_AI_CHATS = /* GraphQL */ `
    query ListAiChats($after: String) {
        aiPowerUps {
            listAiChats(after: $after) {
                data {
                    id
                    title
                    createdOn
                    savedOn
                }
                meta {
                    cursor
                    hasMoreItems
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const GET_AI_CHAT = /* GraphQL */ `
    query GetAiChat($id: ID!) {
        aiPowerUps {
            getAiChat(id: $id) {
                data {
                    id
                    title
                    createdOn
                    savedOn
                    messages
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const SAVE_AI_CHAT = /* GraphQL */ `
    mutation SaveAiChat($data: AiChatInput!) {
        aiPowerUps {
            saveAiChat(data: $data) {
                data {
                    id
                    title
                    createdOn
                    savedOn
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const DELETE_AI_CHAT = /* GraphQL */ `
    mutation DeleteAiChat($id: ID!) {
        aiPowerUps {
            deleteAiChat(id: $id) {
                data
                ${ERROR_FIELDS}
            }
        }
    }
`;

interface GraphQLError {
    code: string;
    message: string;
}

interface Response<TData, TMeta = undefined> {
    data: TData | null;
    meta?: TMeta;
    error: GraphQLError | null;
}

interface ListResponse {
    aiPowerUps: {
        listAiChats: Response<AiChatSummary[], { cursor: string | null; hasMoreItems: boolean }>;
    };
}

interface GetResponse {
    aiPowerUps: { getAiChat: Response<AiChat> };
}

interface SaveResponse {
    aiPowerUps: { saveAiChat: Response<AiChatSummary> };
}

interface DeleteResponse {
    aiPowerUps: { deleteAiChat: Response<boolean> };
}

/** Every operation answers `{ data, error }`; a missing `data` without an error is still a failure. */
function unwrap<TData, TMeta>(response: Response<TData, TMeta>): TData {
    if (response.error) {
        throw new Error(response.error.message);
    }
    if (response.data === null) {
        throw new Error("The API returned no data.");
    }
    return response.data;
}

class AiChatsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async list(after?: string): Promise<AiChatsPage> {
        const response = await this.client.execute<ListResponse>({
            query: LIST_AI_CHATS,
            variables: { after }
        });

        const result = response.aiPowerUps.listAiChats;
        const chats = unwrap(result);
        const meta = result.meta;

        let cursor: string | null = null;
        if (meta?.hasMoreItems) {
            cursor = meta.cursor;
        }

        return { chats, cursor };
    }

    async get(id: string): Promise<AiChat> {
        const response = await this.client.execute<GetResponse>({
            query: GET_AI_CHAT,
            variables: { id }
        });

        return unwrap(response.aiPowerUps.getAiChat);
    }

    async save(input: SaveAiChatInput): Promise<AiChatSummary> {
        const response = await this.client.execute<SaveResponse>({
            query: SAVE_AI_CHAT,
            variables: { data: input }
        });

        return unwrap(response.aiPowerUps.saveAiChat);
    }

    async delete(id: string): Promise<void> {
        const response = await this.client.execute<DeleteResponse>({
            query: DELETE_AI_CHAT,
            variables: { id }
        });

        unwrap(response.aiPowerUps.deleteAiChat);
    }
}

export const AiChatsGateway = GatewayAbstraction.createImplementation({
    implementation: AiChatsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
