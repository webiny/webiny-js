import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";

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
    query GetPage($where: PageGetWhereInput!) {
        getPage(where: $where) {
            data {
                ${pageFields}
            }
            ${errorFields}
        }
    }
`;
export const usePageReadHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getPage(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getPageQuery, variables },
                headers
            });
        }
    };
};
