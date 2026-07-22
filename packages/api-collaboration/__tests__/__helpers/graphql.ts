import type { GenericRecord } from "@webiny/api/types.js";

export interface ICollabError {
    code: string;
    message: string;
    data?: GenericRecord;
}

const ERROR = /* GraphQL */ `
    error {
        code
        message
    }
`;

const IDENTITY = /* GraphQL */ `
    {
        id
        displayName
        type
    }
`;

const MESSAGE = /* GraphQL */ `
    {
        id
        body
        mentions
        createdBy ${IDENTITY}
        createdOn
        deleted
    }
`;

const THREAD = /* GraphQL */ `
    {
        id
        contentType
        contentId
        locator
        type
        resolved
        resolvedBy ${IDENTITY}
        resolvedOn
        assigneeId
        dueDate
        createdBy ${IDENTITY}
        createdOn
        messages ${MESSAGE}
        anchor {
            exists
            authorized
            label
            path
        }
    }
`;

export const CREATE_COLLAB_THREAD_MUTATION = /* GraphQL */ `
    mutation CreateCollabThread($input: CreateCollabThreadInput!) {
        collaboration {
            createCollabThread(input: $input) {
                data ${THREAD}
                ${ERROR}
            }
        }
    }
`;

export const LIST_COLLAB_THREADS_QUERY = /* GraphQL */ `
    query ListCollabThreads($where: ListCollabThreadsWhereInput!, $limit: Int, $after: String) {
        collaboration {
            listCollabThreads(where: $where, limit: $limit, after: $after) {
                data ${THREAD}
                meta {
                    totalCount
                    hasMoreItems
                    cursor
                }
                ${ERROR}
            }
        }
    }
`;

export const GET_COLLAB_THREAD_QUERY = /* GraphQL */ `
    query GetCollabThread($id: ID!) {
        collaboration {
            getCollabThread(id: $id) {
                data ${THREAD}
                ${ERROR}
            }
        }
    }
`;

export const REPLY_TO_COLLAB_THREAD_MUTATION = /* GraphQL */ `
    mutation ReplyToCollabThread($threadId: ID!, $body: String!, $mentions: [String!]) {
        collaboration {
            replyToCollabThread(threadId: $threadId, body: $body, mentions: $mentions) {
                data ${MESSAGE}
                ${ERROR}
            }
        }
    }
`;

export const RESOLVE_COLLAB_THREAD_MUTATION = /* GraphQL */ `
    mutation ResolveCollabThread($id: ID!) {
        collaboration {
            resolveCollabThread(id: $id) {
                data ${THREAD}
                ${ERROR}
            }
        }
    }
`;

export const REOPEN_COLLAB_THREAD_MUTATION = /* GraphQL */ `
    mutation ReopenCollabThread($id: ID!) {
        collaboration {
            reopenCollabThread(id: $id) {
                data ${THREAD}
                ${ERROR}
            }
        }
    }
`;

export const UPDATE_COLLAB_MESSAGE_MUTATION = /* GraphQL */ `
    mutation UpdateCollabMessage($threadId: ID!, $messageId: ID!, $body: String!) {
        collaboration {
            updateCollabMessage(threadId: $threadId, messageId: $messageId, body: $body) {
                data ${MESSAGE}
                ${ERROR}
            }
        }
    }
`;

export const DELETE_COLLAB_MESSAGE_MUTATION = /* GraphQL */ `
    mutation DeleteCollabMessage($threadId: ID!, $messageId: ID!) {
        collaboration {
            deleteCollabMessage(threadId: $threadId, messageId: $messageId) {
                data
                ${ERROR}
            }
        }
    }
`;

export const DELETE_COLLAB_THREAD_MUTATION = /* GraphQL */ `
    mutation DeleteCollabThread($id: ID!) {
        collaboration {
            deleteCollabThread(id: $id) {
                data
                ${ERROR}
            }
        }
    }
`;
