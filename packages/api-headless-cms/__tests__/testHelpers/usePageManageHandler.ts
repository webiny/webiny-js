import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsEntryListParams, CmsModel } from "~/types";
import { pageModel } from "~tests/contentAPI/mocks/pageWithDynamicZonesModel";

const singularPageApiName = pageModel.singularApiName;

const pageFields = `
    id
    content {
        ...on ${singularPageApiName}_Content_Hero {
            title
            _templateId
            __typename
        }
        ...on ${singularPageApiName}_Content_SimpleText {
            text
            _templateId
            __typename
        }
        ...on ${singularPageApiName}_Content_Objecting {
            nestedObject {
                __typename
                objectTitle
                objectNestedObject {
                    nestedObjectNestedTitle
                }
            }
            dynamicZone {
                __typename
                ... on ${singularPageApiName}_Content_Objecting_DynamicZone_SuperNestedObject {
                    authors {
                        id
                        modelId
                    }
                }
            }
            _templateId
            __typename
        }
        ...on ${singularPageApiName}_Content_Author {
            author {
                id
                modelId
            }
            authors {
                id
                modelId
            }
            _templateId
            __typename
        }
    }
    header {
        ...on ${singularPageApiName}_Header_TextHeader {
            title
            __typename
        }
        ...on ${singularPageApiName}_Header_ImageHeader {
            title
            image
            __typename
        }
    }
    objective {
        ...on ${singularPageApiName}_Objective_Objecting {
            nestedObject {
                objectTitle
                objectBody
                objectNestedObject {
                    nestedObjectNestedTitle
                }
            }
            __typename
        }
    }
    reference {
        ...on ${singularPageApiName}_Reference_Author {
            __typename
            author {
                id
                modelId
                __typename
            }
        }
    }
    references1 {
        ...on ${singularPageApiName}_References1_Authors {
            authors {
                id
                modelId
                __typename
            }
            __typename
        }
    }
    references2 {
        ...on ${singularPageApiName}_References2_Author {
            author {
                id
                modelId
                __typename
            }
            __typename
        }
    }
`;

const errorFields = `
    error {
        code
        message
        data
        stack
    }
`;

const getPageQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetPage($revision: ID, $entryId: ID, $status: CmsEntryStatusType) {
            getPage: get${model.singularApiName}(revision: $revision, entryId: $entryId, status: $status) {
                data {
                    ${pageFields}
                }
                ${errorFields}
            }
        }
    `;
};

const listPagesQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListPages(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
            listPages: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
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
};

const createPageMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreatePage($data: ${model.singularApiName}Input!) {
            createPage: create${model.singularApiName}(data: $data) {
                data {
                    ${pageFields}
                }
                ${errorFields}
            }
        }
    `;
};

const updatePageMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdatePage($revision: ID!, $data: ${model.singularApiName}Input!) {
            updatePage: update${model.singularApiName}(revision: $revision, data: $data) {
                data {
                    ${pageFields}
                }
                ${errorFields}
            }
        }
    `;
};

export const usePageManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = pageModel as CmsModel;

    return {
        ...contentHandler,
        async getPage(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: getPageQuery(model),
                    variables
                },
                headers
            });
        },
        async listPages(variables: CmsEntryListParams = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listPagesQuery(model), variables },
                headers
            });
        },
        async createPage(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createPageMutation(model), variables },
                headers
            });
        },
        async updatePage(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: updatePageMutation(model), variables },
                headers
            });
        }
    };
};
