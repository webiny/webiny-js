import gql from "graphql-tag";
import { ApwReviewer } from "~/types";

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

const DATA_FIELDS = `{
    id
    createdOn
    savedOn
    createdBy {
        id
        displayName
        type
    }
    identityId
    displayName
    type
}`;

/**
 * ##################
 * Get "Reviewer" Query Response
 */
export interface GetReviewerQueryResponse {
    apw: {
        getReviewer: {
            data: ApwReviewer;
            error?: Error | null;
        };
    };
}

export interface GetReviewerQueryVariables {
    id: string;
}

export const GET_REVIEWER_QUERY = /* GraphQL */ gql`
    query GetReviewer($id: ID!) {
        apw {
            getWorkflow(id: $id) {
                data ${DATA_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * List "Reviewer" Query Response
 */
export interface ListReviewersResponse {
    data: ApwReviewer[];
    error?: Error | null;
    meta: {
        hasMoreItems: boolean;
        totalItem: number;
        cursor: string | null;
    };
}

export interface ListReviewersQueryResponse {
    apw: {
        listReviewers: ListReviewersResponse;
    };
}

export interface ListReviewersQueryVariables {
    where?: Record<string, any>;
    limit?: number;
    after?: string;
    sort?: string[];
    search?: string;
}

export const LIST_REVIEWS_QUERY = /* GraphQL */ gql`
    query ListReviewers(
        $where: ApwListReviewersWhereInput
        $limit: Int
        $after: String
        $sort: [ApwListReviewersSort!]
        $search: ApwListReviewersSearchInput
    ) {
        apw {
            listReviewers(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort,
                search: $search
            ) {
                data ${DATA_FIELDS}
                error ${ERROR_FIELDS}
                meta ${META_FIELDS}
            }
        }
    }
`;
