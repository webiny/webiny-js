import gql from "graphql-tag";
import { PbErrorResponse, PbPageData } from "~/types";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const DATA_FIELD = `
    {
        id
        pid
        title
        path
        version
        locked
        status
        category {
            url
            name
            slug
        }
        revisions {
            id
            title
            status
            locked
            version
            savedOn
        }
        createdBy {
            id
        }
        content
        savedOn
    }
`;
/**
 * #####################
 * Create Page From Mutation
 */
export interface CreatePageFromMutationResponse {
    pageBuilder: {
        createPage: {
            data: PbPageData;
            error?: PbErrorResponse;
        };
    };
}
export interface CreatePageFromMutationVariables {
    from: string;
}
export const CREATE_PAGE_FROM = gql`
    mutation CreatePageFrom($from: ID) {
        pageBuilder {
            createPage(from: $from) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
/**
 * #####################
 * Get Page Query Response
 */
export interface GetPageQueryResponse {
    pageBuilder: {
        getPage: {
            data: PbPageData | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface GetPageQueryVariables {
    id: string;
}
export const GET_PAGE = gql`
    query PbGetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
