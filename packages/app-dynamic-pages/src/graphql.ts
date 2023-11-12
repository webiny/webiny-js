import gql from "graphql-tag";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export interface ErrorResponse {
    message: string;
    code?: string | null;
    data?: Record<string, any>;
}

/**
 * ##############################
 * Get Dynamic Page Data Query Response
 */
export interface GetDynamicPageDataQueryResponse {
    getDynamicPageData: {
        data: {
            data: {
                result: {
                    data: JSON[];
                };
            };
        } | null;
        error: ErrorResponse | null;
    };
}

export const GET_DYNAMIC_PAGE_DATA = gql`
    query GetDynamicPageData(
        $modelId: String!
        $paths: [String!]
        $filter: GetDynamicPageDataFilterInput
        $sort: [GetDynamicPageDataSortInput!]
        $limit: Number
        $where: GetDynamicPageDataWhereInput
        $isPreviewEndpoint: Boolean
    ) {
        getDynamicPageData(
            modelId: $modelId,
            paths: $paths,
            filter: $filter,
            sort: $sort,
            limit: $limit,
            where: $where,
            isPreviewEndpoint: $isPreviewEndpoint
        ) {
            data
            error ${ERROR_FIELD}
        }
    }
`;
