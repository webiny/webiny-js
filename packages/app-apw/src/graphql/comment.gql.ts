import gql from "graphql-tag";
import { ApwComment } from "~/types";

const ERROR_FIELDS = `{
    message
    code
    data
}`;

const META_FIELDS = `{
    totalCount
    hasMoreItems
    cursor
}`;

const getDataFields = (fields = "") => `{
    id
    createdOn
    savedOn
    createdBy {
        id
        displayName
        type
    }
    body
    changeRequest
    media
    ${fields}
}`;

/**
 * ##################
 * Get "Comment" Query Response
 */
export interface GetCommentQueryResponse {
    apw: {
        getComment: {
            data: ApwComment;
            error?: Error | null;
        };
    };
}

export interface GetCommentQueryVariables {
    id: string;
}

export const GET_COMMENT_QUERY = /* GraphQL */ gql`
    query GetComment($id: ID!) {
        apw {
            getComment(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * List "Comment" Query Response
 */
export interface ListCommentsResponse {
    data: ApwComment[];
    error?: Error | null;
    meta: {
        hasMoreItems: boolean;
        totalItem: number;
        cursor: string | null;
    };
}

export interface ListCommentsQueryResponse {
    apw: {
        listComments: ListCommentsResponse;
    };
}

export interface ListCommentsQueryVariables {
    where?: Record<string, any>;
    sort?: string[];
    limit?: number;
    after?: string;
}

export const LIST_COMMENTS_QUERY = /* GraphQL */ gql`
    query ListComments(
        $where: ApwListCommentsWhereInput,
        $limit: Int,
        $after: String,
        $sort: [ApwListCommentsSort!]
    ) {
        apw {
            listComments(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort
            ) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
                meta ${META_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Create "Comment" Mutation Response
 */
export interface CreateCommentMutationResponse {
    apw: {
        comment: {
            data: ApwComment;
            error?: Error | null;
        };
    };
}

export interface CreateCommentMutationVariables {
    data: Partial<ApwComment>;
}

export const CREATE_COMMENT_MUTATION = /* GraphQL */ gql`
    mutation CreateCommentMutation($data: ApwCreateCommentInput!) {
        apw {
            comment: createComment(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;
