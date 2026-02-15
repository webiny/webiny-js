import type { GraphQLHandlerParams } from "./useGraphQLHandler";
import { useGraphQLHandler } from "./useGraphQLHandler";

interface CmsListEntriesVariables {
    modelId: string;
    where?: Record<string, unknown>;
    sort?: Record<string, unknown>;
    limit?: number;
    after?: string;
    fields: string[];
    preview?: boolean;
}

interface CmsGetEntryVariables {
    modelId: string;
    where: Record<string, unknown>;
    fields: string[];
    preview?: boolean;
}

interface CmsGetEntryRevisionByIdVariables {
    modelId: string;
    revisionId: string;
    fields: string[];
}

interface CmsResponse<T = any> {
    data: T;
    error: {
        code: string;
        message: string;
        data?: Record<string, any>;
    } | null;
}

interface CmsListResponse<T = any> {
    data: T[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
    error: {
        code: string;
        message: string;
        data?: Record<string, any>;
    } | null;
}

type GqlHandlerInvokeResponse = ReturnType<ReturnType<typeof useGraphQLHandler>["invoke"]>;

const extractCmsResponseData = async (response: Awaited<GqlHandlerInvokeResponse>) => {
    const parsedResponseBody = response[0] as Record<string, any>;
    return parsedResponseBody.data.cms;
};

interface UseSdkGqlHandlerParams extends GraphQLHandlerParams {}

/**
 * Creates a handler for testing SDK GraphQL schema queries on the main /graphql endpoint.
 * This handler exposes the { cms { ... } } queries that the SDK uses.
 * Does not include manage endpoint methods - use a separate handler for those.
 */
export const useSdkGqlHandler = (params: UseSdkGqlHandlerParams = {}) => {
    // Use the main /graphql endpoint (no path specified) for SDK GraphQL queries.
    const handler = useGraphQLHandler({ ...params });

    const createListEntriesQuery = (variables: CmsListEntriesVariables) => {
        return {
            body: {
                query: /* GraphQL */ `
                    query ListEntries(
                        $modelId: ID!
                        $where: JSON
                        $sort: JSON
                        $limit: Int
                        $after: String
                        $fields: [String!]!
                        $preview: Boolean
                    ) {
                        cms {
                            listEntries(
                                modelId: $modelId
                                where: $where
                                sort: $sort
                                limit: $limit
                                after: $after
                                fields: $fields
                                preview: $preview
                            ) {
                                data
                                meta {
                                    cursor
                                    hasMoreItems
                                    totalCount
                                }
                                error {
                                    message
                                    code
                                    data
                                }
                            }
                        }
                    }
                `,
                variables
            }
        };
    };

    const createGetEntryQuery = (variables: CmsGetEntryVariables) => {
        return {
            body: {
                query: /* GraphQL */ `
                    query GetEntry(
                        $modelId: ID!
                        $where: JSON!
                        $fields: [String!]!
                        $preview: Boolean
                    ) {
                        cms {
                            getEntry(
                                modelId: $modelId
                                where: $where
                                fields: $fields
                                preview: $preview
                            ) {
                                data
                                error {
                                    message
                                    code
                                    data
                                }
                            }
                        }
                    }
                `,
                variables
            }
        };
    };

    const createGetEntryRevisionByIdQuery = (variables: CmsGetEntryRevisionByIdVariables) => {
        return {
            body: {
                query: /* GraphQL */ `
                    query GetEntryRevisionById(
                        $modelId: ID!
                        $revisionId: ID!
                        $fields: [String!]!
                    ) {
                        cms {
                            getEntryRevisionById(
                                modelId: $modelId
                                revisionId: $revisionId
                                fields: $fields
                            ) {
                                data
                                error {
                                    message
                                    code
                                    data
                                }
                            }
                        }
                    }
                `,
                variables
            }
        };
    };

    return {
        // SDK GraphQL query methods that call the main /graphql endpoint.
        async listEntries(variables: CmsListEntriesVariables): Promise<CmsListResponse> {
            const result = await handler.invoke(createListEntriesQuery(variables));
            const cmsData = await extractCmsResponseData(result);
            return cmsData.listEntries;
        },
        async getEntry(variables: CmsGetEntryVariables): Promise<CmsResponse> {
            const result = await handler.invoke(createGetEntryQuery(variables));
            const cmsData = await extractCmsResponseData(result);
            return cmsData.getEntry;
        },
        async getEntryRevisionById(
            variables: CmsGetEntryRevisionByIdVariables
        ): Promise<CmsResponse> {
            const result = await handler.invoke(createGetEntryRevisionByIdQuery(variables));
            const cmsData = await extractCmsResponseData(result);
            return cmsData.getEntryRevisionById;
        }
    };
};
