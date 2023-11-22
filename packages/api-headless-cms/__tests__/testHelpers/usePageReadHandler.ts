import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { pageModel } from "~tests/contentAPI/mocks/pageWithDynamicZonesModel";

const singularPageApiName = pageModel.singularApiName;

const pageFields = `
    id
    content {
        ...on ${singularPageApiName}_Content_Hero {
            title
            __typename
        }
        ...on ${singularPageApiName}_Content_SimpleText {
            text
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
                ... on ${singularPageApiName}_Content_Objecting_DynamicZone_SuperNestedObject {
                    authors {
                        id
                        modelId
                        entryId
                        fullName
                    }
                }
            }
            __typename
        }
        ...on ${singularPageApiName}_Content_Author {
            author(populate: true) {
                id
                entryId
                modelId
                fullName
            }
            authors(populate: true) {
                id
                entryId
                modelId
                fullName
            }
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
            author(populate: true) {
                id
                entryId
                modelId
                fullName
            }
        }
    }
    references1 {
        ...on ${singularPageApiName}_References1_Authors {
            authors(populate: true) {
                id
                entryId
                modelId
                fullName
            }
        }
    }
    references2 {
        ...on ${singularPageApiName}_References2_Author {
            author(populate: true) {
                id
                entryId
                modelId
                fullName
            }
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

const getPageQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetPage($where: ${model.singularApiName}GetWhereInput!) {
            getPage: get${model.singularApiName}(where: $where) {
                data {
                    ${pageFields}
                }
                ${errorFields}
            }
        }
    `;
};
export const usePageReadHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = pageModel as CmsModel;

    return {
        ...contentHandler,
        async getPage(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getPageQuery(model), variables },
                headers
            });
        }
    };
};
