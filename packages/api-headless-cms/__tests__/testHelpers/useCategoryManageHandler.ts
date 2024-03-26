import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsEntryListParams, CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const identityFields = /* GraphQL */ `
    {
        id
        displayName
        type
    }
`;

const categoryFields = `
    id
    entryId
    createdOn
    modifiedOn
    savedOn
    firstPublishedOn
    lastPublishedOn
    deletedOn
    restoredOn
    createdBy ${identityFields}
    modifiedBy ${identityFields}
    savedBy ${identityFields}
    deletedBy ${identityFields}
    restoredBy ${identityFields}
    meta {
        title
        modelId
        version
        locked
        status
       
        revisions {
            id
            title
            slug
            meta {
                status
                version
            }
        }
        data
    }
    wbyAco_location {
        folderId
    }
    # user defined fields
    title
    slug
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getCategoryQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetCategory($revision: ID, $entryId: ID, $status: CmsEntryStatusType) {
            getCategory: get${model.singularApiName}(revision: $revision, entryId: $entryId, status: $status) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const getCategoriesByIdsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetCategories($revisions: [ID!]!) {
            getCategoriesByIds: get${model.pluralApiName}ByIds(revisions: $revisions) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const listCategoriesQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListCategories(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
            listCategories: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    ${categoryFields}
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

const listDeletedCategoriesQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListDeletedCategories(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
            listDeletedCategories: listDeleted${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    ${categoryFields}
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

const createCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateCategory($data: ${model.singularApiName}Input!) {
            createCategory: create${model.singularApiName}(data: $data) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const createCategoryFromMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateCategoryFrom($revision: ID!, $data: ${model.singularApiName}Input) {
            createCategoryFrom: create${model.singularApiName}From(revision: $revision, data: $data) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const updateCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdateCategory($revision: ID!, $data: ${model.singularApiName}Input!) {
            updateCategory: update${model.singularApiName}(revision: $revision, data: $data) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

export interface MoveCategoryVariables {
    revision: string;
    folderId: string;
}

const moveCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation MoveCategory($revision: ID!, $folderId: ID!) {
            moveCategory: move${model.singularApiName}(revision: $revision, folderId: $folderId) {
                data
                ${errorFields}
            }
        }
    `;
};

const deleteCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation DeleteCategory($revision: ID!, $options: CmsDeleteEntryOptions) {
            deleteCategory: delete${model.singularApiName}(revision: $revision, options: $options) {
                data
                ${errorFields}
            }
        }
    `;
};

const restoreCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation RestoreCategory($revision: ID!) {
            restoreCategory: restore${model.singularApiName}(revision: $revision) {
                data
                ${errorFields}
            }
        }
    `;
};

const deleteCategoriesMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation DeleteCategories($entries: [ID!]!) {
            deleteCategories: deleteMultiple${model.pluralApiName}(entries: $entries) {
                data {
                    id
                }
                ${errorFields}
            }
        }
    `;
};

const publishCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation PublishCategory($revision: ID!) {
            publishCategory: publish${model.singularApiName}(revision: $revision) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const republishCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation RepublishCategory($revision: ID!) {
            republishCategory: republish${model.singularApiName}(revision: $revision) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const unpublishCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UnpublishCategory($revision: ID!) {
            unpublishCategory: unpublish${model.singularApiName}(revision: $revision) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

export const useCategoryManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("category");

    return {
        ...contentHandler,
        async getCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: getCategoryQuery(model),
                    variables
                },
                headers
            });
        },
        async getCategoriesByIds(
            variables: Record<string, any>,
            headers: Record<string, any> = {}
        ) {
            return await contentHandler.invoke({
                body: { query: getCategoriesByIdsQuery(model), variables },
                headers
            });
        },
        async listCategories(
            variables: CmsEntryListParams = {},
            headers: Record<string, any> = {}
        ) {
            return await contentHandler.invoke({
                body: { query: listCategoriesQuery(model), variables },
                headers
            });
        },
        async listDeletedCategories(
            variables: CmsEntryListParams = {},
            headers: Record<string, any> = {}
        ) {
            return await contentHandler.invoke({
                body: { query: listDeletedCategoriesQuery(model), variables },
                headers
            });
        },
        async createCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createCategoryMutation(model), variables },
                headers
            });
        },
        async createCategoryFrom(
            variables: Record<string, any>,
            headers: Record<string, any> = {}
        ) {
            return await contentHandler.invoke({
                body: { query: createCategoryFromMutation(model), variables },
                headers
            });
        },
        async updateCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateCategoryMutation(model),
                    variables
                },
                headers
            });
        },
        async moveCategory(variables: MoveCategoryVariables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: moveCategoryMutation(model),
                    variables
                },
                headers
            });
        },
        async deleteCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteCategoryMutation(model),
                    variables
                },
                headers
            });
        },
        async restoreCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: restoreCategoryMutation(model),
                    variables
                },
                headers
            });
        },
        async deleteCategories(entries: string[]) {
            return await contentHandler.invoke({
                body: {
                    query: deleteCategoriesMutation(model),
                    variables: {
                        entries
                    }
                }
            });
        },
        async publishCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishCategoryMutation(model),
                    variables
                },
                headers
            });
        },
        async republishCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: republishCategoryMutation(model),
                    variables
                },
                headers
            });
        },
        async unpublishCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishCategoryMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
