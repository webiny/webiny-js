import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { pageModel } from "~tests/contentAPI/mocks/pageWithDynamicZonesModel";

const singularPageApiName = pageModel.singularApiName;

const pageFields = `
    id   
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
