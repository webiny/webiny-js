import type { CmsContext } from "~/types/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { ContextPlugin } from "@webiny/api";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver } from "graphql";

interface CmsSdkResolverArgs {
    context: CmsContext;
}

const createGetEntryResolver = (): GraphQLFieldResolver<any, CmsContext, any> => {
    return async (_, args, context) => {
        const { modelId, where } = args;

        try {
            // Determine which API to use based on the query
            // For now, we'll use the read API for published content
            const apiType: ApiEndpoint = "read";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            // Build the dynamic query based on the model
            const modelCamelCase = modelId.charAt(0).toLowerCase() + modelId.slice(1);

            const query = `
                query Get${modelId}($where: ${modelId}GetWhereInput!) {
                    get${modelId}(where: $where) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({ query, variables: { where } });

            return result.data?.[`get${modelId}`] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: error.message || "Failed to get entry",
                    code: "GET_ENTRY_ERROR"
                }
            };
        }
    };
};

const createListEntriesResolver = (): GraphQLFieldResolver<any, CmsContext, any> => {
    return async (_, args, context) => {
        const { modelId, where, sort, limit, after } = args;

        try {
            // Use read API for listing published content
            const apiType: ApiEndpoint = "read";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const modelCamelCase = modelId.charAt(0).toLowerCase() + modelId.slice(1);
            const modelPluralCase = `${modelCamelCase}s`; // Simple pluralization

            const query = `
                query List${modelId}s(
                    $where: ${modelId}ListWhereInput
                    $sort: [${modelId}ListSorter!]
                    $limit: Int
                    $after: String
                ) {
                    list${modelId}s(
                        where: $where
                        sort: $sort
                        limit: $limit
                        after: $after
                    ) {
                        data {
                            id
                            entryId
                        }
                        meta {
                            cursor
                            hasMoreItems
                            totalCount
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({
                query,
                variables: { where, sort, limit, after }
            });

            return (
                result.data?.[`list${modelId}s`] || {
                    data: [],
                    meta: { cursor: null, hasMoreItems: false, totalCount: 0 },
                    error: null
                }
            );
        } catch (error) {
            return {
                data: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 },
                error: {
                    message: error.message || "Failed to list entries",
                    code: "LIST_ENTRIES_ERROR"
                }
            };
        }
    };
};

const createCreateEntryResolver = (): GraphQLFieldResolver<any, CmsContext, any> => {
    return async (_, args, context) => {
        const { modelId, values } = args;

        try {
            // Use manage API for creating entries
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Create${modelId}($data: ${modelId}Input!) {
                    create${modelId}(data: $data) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({ query, variables: { data: values } });

            return result.data?.[`create${modelId}`] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: error.message || "Failed to create entry",
                    code: "CREATE_ENTRY_ERROR"
                }
            };
        }
    };
};

const createUpdateEntryResolver = (): GraphQLFieldResolver<any, CmsContext, any> => {
    return async (_, args, context) => {
        const { modelId, id, values } = args;

        try {
            // Use manage API for updating entries
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Update${modelId}($revision: ID!, $data: ${modelId}Input!) {
                    update${modelId}(revision: $revision, data: $data) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({
                query,
                variables: { revision: id, data: values }
            });

            return result.data?.[`update${modelId}`] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: error.message || "Failed to update entry",
                    code: "UPDATE_ENTRY_ERROR"
                }
            };
        }
    };
};

const createDeleteEntryResolver = (): GraphQLFieldResolver<any, CmsContext, any> => {
    return async (_, args, context) => {
        const { modelId, id, permanent = false } = args;

        try {
            // Use manage API for deleting entries
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Delete${modelId}($revision: ID!, $options: CmsDeleteEntryOptions) {
                    delete${modelId}(revision: $revision, options: $options) {
                        data
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({
                query,
                variables: {
                    revision: id,
                    options: { permanently: permanent }
                }
            });

            return result.data?.[`delete${modelId}`] || { data: false, error: null };
        } catch (error) {
            return {
                data: false,
                error: {
                    message: error.message || "Failed to delete entry",
                    code: "DELETE_ENTRY_ERROR"
                }
            };
        }
    };
};

const createPublishEntryResolver = (): GraphQLFieldResolver<any, CmsContext, any> => {
    return async (_, args, context) => {
        const { modelId, id } = args;

        try {
            // Use manage API for publishing entries
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Publish${modelId}($revision: ID!) {
                    publish${modelId}(revision: $revision) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({ query, variables: { revision: id } });

            return result.data?.[`publish${modelId}`] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: error.message || "Failed to publish entry",
                    code: "PUBLISH_ENTRY_ERROR"
                }
            };
        }
    };
};

const createUnpublishEntryResolver = (): GraphQLFieldResolver<any, CmsContext, any> => {
    return async (_, args, context) => {
        const { modelId, id } = args;

        try {
            // Use manage API for unpublishing entries
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Unpublish${modelId}($revision: ID!) {
                    unpublish${modelId}(revision: $revision) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({ query, variables: { revision: id } });

            return result.data?.[`unpublish${modelId}`] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: error.message || "Failed to unpublish entry",
                    code: "UNPUBLISH_ENTRY_ERROR"
                }
            };
        }
    };
};

export const createCmsSdkSchema = () => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        const cmsSdkPlugin = createCmsGraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                type CmsSdkEntry {
                    id: ID!
                    entryId: String!
                }

                type CmsSdkEntryResponse {
                    data: CmsSdkEntry
                    error: CmsError
                }

                type CmsSdkListMeta {
                    cursor: String
                    hasMoreItems: Boolean
                    totalCount: Int
                }

                type CmsSdkListResponse {
                    data: [CmsSdkEntry!]
                    meta: CmsSdkListMeta
                    error: CmsError
                }

                type CmsSdkDeleteResponse {
                    data: Boolean
                    error: CmsError
                }

                type CmsSdkQuery {
                    getEntry(modelId: String!, where: JSON!): CmsSdkEntryResponse!
                    listEntries(
                        modelId: String!
                        where: JSON
                        sort: JSON
                        limit: Int
                        after: String
                        include: [String!]
                        exclude: [String!]
                        excludeType: [String!]
                    ): CmsSdkListResponse!
                }

                type CmsSdkMutation {
                    createEntry(modelId: String!, values: JSON!): CmsSdkEntryResponse!
                    updateEntry(modelId: String!, id: ID!, values: JSON!): CmsSdkEntryResponse!
                    deleteEntry(modelId: String!, id: ID!, permanent: Boolean): CmsSdkDeleteResponse!
                    publishEntry(modelId: String!, id: ID!): CmsSdkEntryResponse!
                    unpublishEntry(modelId: String!, id: ID!): CmsSdkEntryResponse!
                }

                extend type Query {
                    cms: CmsSdkQuery!
                }

                extend type Mutation {
                    cms: CmsSdkMutation!
                }
            `,
            resolvers: {
                Query: {
                    cms: () => ({})
                },
                Mutation: {
                    cms: () => ({})
                },
                CmsSdkQuery: {
                    getEntry: createGetEntryResolver(),
                    listEntries: createListEntriesResolver()
                },
                CmsSdkMutation: {
                    createEntry: createCreateEntryResolver(),
                    updateEntry: createUpdateEntryResolver(),
                    deleteEntry: createDeleteEntryResolver(),
                    publishEntry: createPublishEntryResolver(),
                    unpublishEntry: createUnpublishEntryResolver()
                }
            }
        });

        cmsSdkPlugin.name = "headless-cms.graphql.schema.sdk";

        context.plugins.register(cmsSdkPlugin);
    });

    plugin.name = "headless-cms.graphql.createCmsSdkSchema";

    return plugin;
};
