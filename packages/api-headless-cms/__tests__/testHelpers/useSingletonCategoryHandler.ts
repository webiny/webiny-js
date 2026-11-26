import type { GraphQLHandlerParams } from "./useGraphQLHandler";
import { useGraphQLHandler } from "./useGraphQLHandler";
import type { CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import type { GenericRecord } from "@webiny/api/types";

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
    # user fields
    values {
        title
        slug
    }
`;

const manageCategoryFields = `
    ${categoryFields}
    revisionDescription
    meta {
        modelId
        version
        locked
        status
        title
        revisions {
            id
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

const getCategoryQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetCategory {
            getCategory: get${model.singularApiName} {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const getCategoryLatestQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetCategoryLatest {
            getCategoryLatest: get${model.singularApiName}Latest {
                data {
                    ${manageCategoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const getCategoryRevisionQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetCategoryRevision($revision: ID!) {
            getCategoryRevision: get${model.singularApiName}Revision(revision: $revision) {
                data {
                    ${manageCategoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const getCategoryRevisionsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetCategoryRevisions($id: ID!) {
            getCategoryRevisions: get${model.singularApiName}Revisions(id: $id) {
                data {
                    ${manageCategoryFields}
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
                    ${manageCategoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const updateCategoryRevisionDescriptionMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdateCategoryRevisionDescription($revision: ID!, $revisionDescription: String) {
            updateCategoryRevisionDescription: update${model.singularApiName}RevisionDescription(
                revision: $revision
                revisionDescription: $revisionDescription
            ) {
                data {
                    ${manageCategoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const createCategoryFromMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateCategoryFrom($revision: ID!) {
            createCategoryFrom: create${model.singularApiName}From(revision: $revision) {
                data {
                    ${manageCategoryFields}
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
                    ${manageCategoryFields}
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
                    ${manageCategoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const deleteCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation DeleteCategory($revision: ID!) {
            deleteCategory: delete${model.singularApiName}(revision: $revision) {
                data
                ${errorFields}
            }
        }
    `;
};

export const useSingletonCategoryHandler = (params: GraphQLHandlerParams) => {
    const model = getCmsModel("categorySingleton");
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getCategory(headers: GenericRecord<string> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: getCategoryQuery(model)
                },
                headers
            });
        },
        async getCategoryLatest() {
            return await contentHandler.invoke({
                body: {
                    query: getCategoryLatestQuery(model)
                }
            });
        },
        async getCategoryRevision(revision: string) {
            return await contentHandler.invoke({
                body: {
                    query: getCategoryRevisionQuery(model),
                    variables: { revision }
                }
            });
        },
        async getCategoryRevisions(id: string) {
            return await contentHandler.invoke({
                body: {
                    query: getCategoryRevisionsQuery(model),
                    variables: { id }
                }
            });
        },
        async updateCategory(revision: string, data: GenericRecord) {
            return await contentHandler.invoke({
                body: {
                    query: updateCategoryMutation(model),
                    variables: { revision, data }
                }
            });
        },
        async updateCategoryRevisionDescription(revision: string, revisionDescription: string) {
            return await contentHandler.invoke({
                body: {
                    query: updateCategoryRevisionDescriptionMutation(model),
                    variables: { revision, revisionDescription }
                }
            });
        },
        async createCategoryFrom(revision: string) {
            return await contentHandler.invoke({
                body: {
                    query: createCategoryFromMutation(model),
                    variables: { revision }
                }
            });
        },
        async publishCategory(revision: string) {
            return await contentHandler.invoke({
                body: {
                    query: publishCategoryMutation(model),
                    variables: { revision }
                }
            });
        },
        async unpublishCategory(revision: string) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishCategoryMutation(model),
                    variables: { revision }
                }
            });
        },
        async deleteCategory(revision: string) {
            return await contentHandler.invoke({
                body: {
                    query: deleteCategoryMutation(model),
                    variables: { revision }
                }
            });
        }
    };
};
