import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { CollaborationGateway as GatewayAbstraction } from "./abstractions.js";
import type { IListThreadsOptions, IListThreadsResult } from "./abstractions.js";
import type {
    CollabMessage,
    CollabThread,
    CollabThreadsMeta,
    CollabUser,
    CreateThreadInput,
    ListThreadsWhere
} from "~/types.js";
import { ERROR_FIELDS, MESSAGE_FIELDS, THREAD_FIELDS } from "./graphqlFields.js";

interface GqlError {
    code: string;
    message: string;
    data?: unknown;
}

const unwrap = <T>(envelope: { data: T | null; error: GqlError | null }): T => {
    if (envelope.error) {
        throw new Error(envelope.error.message);
    }
    return envelope.data as T;
};

const LIST_QUERY = /* GraphQL */ `
    query ListCollabThreads($where: ListCollabThreadsWhereInput!, $limit: Int, $after: String) {
        collaboration {
            listCollabThreads(where: $where, limit: $limit, after: $after) {
                data ${THREAD_FIELDS}
                meta { totalCount hasMoreItems cursor }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const CREATE_MUTATION = /* GraphQL */ `
    mutation CreateCollabThread($input: CreateCollabThreadInput!) {
        collaboration { createCollabThread(input: $input) { data ${THREAD_FIELDS} ${ERROR_FIELDS} } }
    }
`;

const REPLY_MUTATION = /* GraphQL */ `
    mutation ReplyToCollabThread($threadId: ID!, $body: String!, $mentions: [String!]) {
        collaboration {
            replyToCollabThread(threadId: $threadId, body: $body, mentions: $mentions) {
                data ${MESSAGE_FIELDS}
                ${ERROR_FIELDS}
            }
        }
    }
`;

const RESOLVE_MUTATION = /* GraphQL */ `
    mutation ResolveCollabThread($id: ID!) {
        collaboration { resolveCollabThread(id: $id) { data ${THREAD_FIELDS} ${ERROR_FIELDS} } }
    }
`;

const REOPEN_MUTATION = /* GraphQL */ `
    mutation ReopenCollabThread($id: ID!) {
        collaboration { reopenCollabThread(id: $id) { data ${THREAD_FIELDS} ${ERROR_FIELDS} } }
    }
`;

const DELETE_MUTATION = /* GraphQL */ `
    mutation DeleteCollabThread($id: ID!) {
        collaboration { deleteCollabThread(id: $id) { data ${ERROR_FIELDS} } }
    }
`;

const UPDATE_MESSAGE_MUTATION = /* GraphQL */ `
    mutation UpdateCollabMessage($threadId: ID!, $messageId: ID!, $body: String!) {
        collaboration {
            updateCollabMessage(threadId: $threadId, messageId: $messageId, body: $body) {
                data ${MESSAGE_FIELDS}
                ${ERROR_FIELDS}
            }
        }
    }
`;

const DELETE_MESSAGE_MUTATION = /* GraphQL */ `
    mutation DeleteCollabMessage($threadId: ID!, $messageId: ID!) {
        collaboration {
            deleteCollabMessage(threadId: $threadId, messageId: $messageId) {
                data ${ERROR_FIELDS}
            }
        }
    }
`;

const LIST_USERS_QUERY = /* GraphQL */ `
    query CollabListMentionableUsers {
        adminUsers {
            listUsers {
                data {
                    id
                    displayName
                    email
                    avatar
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

interface ListResponse {
    collaboration: {
        listCollabThreads: {
            data: CollabThread[] | null;
            meta: CollabThreadsMeta | null;
            error: GqlError | null;
        };
    };
}

class CollaborationGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listThreads(
        where: ListThreadsWhere,
        options: IListThreadsOptions = {}
    ): Promise<IListThreadsResult> {
        const response = await this.client.execute<ListResponse>({
            query: LIST_QUERY,
            variables: { where, limit: options.limit, after: options.after }
        });
        const envelope = response.collaboration.listCollabThreads;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }
        return {
            items: envelope.data || [],
            meta: envelope.meta || { totalCount: 0, hasMoreItems: false, cursor: null }
        };
    }

    async createThread(input: CreateThreadInput): Promise<CollabThread> {
        const response = await this.client.execute<{
            collaboration: {
                createCollabThread: { data: CollabThread | null; error: GqlError | null };
            };
        }>({ query: CREATE_MUTATION, variables: { input } });
        return unwrap(response.collaboration.createCollabThread);
    }

    async replyToThread(
        threadId: string,
        body: string,
        mentions?: string[]
    ): Promise<CollabMessage> {
        const response = await this.client.execute<{
            collaboration: {
                replyToCollabThread: { data: CollabMessage | null; error: GqlError | null };
            };
        }>({ query: REPLY_MUTATION, variables: { threadId, body, mentions } });
        return unwrap(response.collaboration.replyToCollabThread);
    }

    async resolveThread(id: string): Promise<CollabThread> {
        const response = await this.client.execute<{
            collaboration: {
                resolveCollabThread: { data: CollabThread | null; error: GqlError | null };
            };
        }>({ query: RESOLVE_MUTATION, variables: { id } });
        return unwrap(response.collaboration.resolveCollabThread);
    }

    async reopenThread(id: string): Promise<CollabThread> {
        const response = await this.client.execute<{
            collaboration: {
                reopenCollabThread: { data: CollabThread | null; error: GqlError | null };
            };
        }>({ query: REOPEN_MUTATION, variables: { id } });
        return unwrap(response.collaboration.reopenCollabThread);
    }

    async deleteThread(id: string): Promise<boolean> {
        const response = await this.client.execute<{
            collaboration: { deleteCollabThread: { data: boolean | null; error: GqlError | null } };
        }>({ query: DELETE_MUTATION, variables: { id } });
        return unwrap(response.collaboration.deleteCollabThread) === true;
    }

    async updateMessage(threadId: string, messageId: string, body: string): Promise<CollabMessage> {
        const response = await this.client.execute<{
            collaboration: {
                updateCollabMessage: { data: CollabMessage | null; error: GqlError | null };
            };
        }>({ query: UPDATE_MESSAGE_MUTATION, variables: { threadId, messageId, body } });
        return unwrap(response.collaboration.updateCollabMessage);
    }

    async deleteMessage(threadId: string, messageId: string): Promise<boolean> {
        const response = await this.client.execute<{
            collaboration: {
                deleteCollabMessage: { data: boolean | null; error: GqlError | null };
            };
        }>({ query: DELETE_MESSAGE_MUTATION, variables: { threadId, messageId } });
        return unwrap(response.collaboration.deleteCollabMessage) === true;
    }

    async listMentionableUsers(): Promise<CollabUser[]> {
        try {
            const response = await this.client.execute<{
                adminUsers: { listUsers: { data: CollabUser[] | null; error: GqlError | null } };
            }>({ query: LIST_USERS_QUERY });
            const envelope = response.adminUsers.listUsers;
            return envelope.error ? [] : envelope.data || [];
        } catch {
            // Best-effort: mentions degrade gracefully if the caller can't list users.
            return [];
        }
    }
}

export const CollaborationGateway = GatewayAbstraction.createImplementation({
    implementation: CollaborationGatewayImpl,
    dependencies: [MainGraphQLClient]
});
