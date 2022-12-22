import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsEntryListParams } from "~/types";

const pageFields = `
    id
    content {
        ...on Page_Content_Hero {
            title
            __typename
        }
        ...on Page_Content_SimpleText {
            text
            __typename
        }
    }
    header {
        ...on Page_Header_TextHeader {
            title
            __typename
        }
        ...on Page_Header_ImageHeader {
            title
            image
            __typename
        }
    }
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getPageQuery = /* GraphQL */ `
    query GetPage($revision: ID, $entryId: ID, $status: CmsEntryStatusType) {
        getPage(revision: $revision, entryId: $entryId, status: $status) {
            data {
                ${pageFields}
            }
            ${errorFields}
        }
    }
`;

const listPagesQuery = /* GraphQL */ `
    query ListPages(
        $where: PageListWhereInput
        $sort: [PageListSorter]
        $limit: Int
        $after: String
    ) {
        listPages(where: $where, sort: $sort, limit: $limit, after: $after) {
            data {
                ${pageFields}
            }
            meta {
                cursor
                hasMoreItems
                totalCount
            }
            ${errorFields}
        }
    }
`;

const createPageMutation = /* GraphQL */ `
    mutation CreatePage($data: PageInput!) {
        createPage(data: $data) {
            data {
                ${pageFields}
            }
            ${errorFields}
        }
    }
`;

export const usePageManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getPage(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: getPageQuery,
                    variables
                },
                headers
            });
        },
        async listPages(variables: CmsEntryListParams = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listPagesQuery, variables },
                headers
            });
        },
        async createPage(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createPageMutation, variables },
                headers
            });
        }
    };
};
