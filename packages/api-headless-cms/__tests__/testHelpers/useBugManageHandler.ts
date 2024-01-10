import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const bugFields = `
    id
    createdOn
    modifiedOn
    savedOn
    firstPublishedOn
    lastPublishedOn
    createdBy {
        id
        displayName
        type
    }
    meta {
        title
        modelId
        version
        locked
        status
    }
    # user defined fields
    name
    bugType
    bugValue
    bugFixed
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getBugQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetBug($revision: ID!) {
            getBug: get${model.singularApiName}(revision: $revision) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
        }
    `;
};

const getBugsByIdsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetBugs($revisions: [ID!]!) {
            getBugsByIds: get${model.pluralApiName}ByIds(revisions: $revisions) {
                data {
                    ${bugFields}
                }
                ${errorFields}
            }
        }
    `;
};

const listBugsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListBugs(
            $where: ${model.singularApiName}ListWhereInput
        $sort: [${model.singularApiName}ListSorter]
        $limit: Int
        $after: String
        ) {
        listBugs: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
        data {
        ${bugFields}
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

const createBugMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateBug($data: ${model.singularApiName}Input!) {
        createBug: create${model.singularApiName}(data: $data) {
        data {
        ${bugFields}
        }
        ${errorFields}
        }
        }
    `;
};

const createBugFromMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateBugFrom($revision: ID!) {
            createBugFrom: create${model.singularApiName}From(revision: $revision) {
                data {
                    ${bugFields}
                }
                ${errorFields}
            }
        }
    `;
};

const updateBugMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdateBug($revision: ID!, $data: ${model.singularApiName}Input!) {
        updateBug: update${model.singularApiName}(revision: $revision, data: $data) {
        data {
        ${bugFields}
        }
        ${errorFields}
        }
        }
    `;
};

const deleteBugMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation DeleteBug($revision: ID!) {
            deleteBug: delete${model.singularApiName}(revision: $revision) {
            data
            ${errorFields}
        }
        }
    `;
};

const publishBugMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation PublishBug($revision: ID!) {
            publishBug: publish${model.singularApiName}(revision: $revision) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
        }
    `;
};

const unpublishBugMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UnpublishBug($revision: ID!) {
            unpublishBug: unpublish${model.singularApiName}(revision: $revision) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
        }
    `;
};

export const useBugManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("bug");

    return {
        ...contentHandler,
        async getBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getBugQuery(model), variables },
                headers
            });
        },
        async getBugsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getBugsByIdsQuery(model), variables },
                headers
            });
        },
        async listBugs(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listBugsQuery(model), variables },
                headers
            });
        },
        async createBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createBugMutation(model), variables },
                headers
            });
        },
        async createBugFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createBugFromMutation(model), variables },
                headers
            });
        },
        async updateBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateBugMutation(model),
                    variables
                },
                headers
            });
        },
        async deleteBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteBugMutation(model),
                    variables
                },
                headers
            });
        },
        async publishBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishBugMutation(model),
                    variables
                },
                headers
            });
        },
        async unpublishBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishBugMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
