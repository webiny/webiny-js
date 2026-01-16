import type { GraphQLHandlerParams } from "./useGraphQLHandler";
import { useGraphQLHandler } from "./useGraphQLHandler";
import type {
    ICreateTestEntryFromMutationVariables,
    ICreateTestEntryMutationVariables,
    IDeleteTestEntriesMutationVariables,
    IDeleteTestEntryMutationVariables,
    IManageGetTestEntriesByIdsVariables,
    IManageGetTestEntryVariables,
    IManageListTestEntryVariables,
    IMoveTestEntryMutationVariables,
    IPublishTestEntryMutationVariables,
    IRepublishTestEntryMutationVariables,
    IUnpublishTestEntryMutationVariables,
    IUpdateTestEntryMutationVariables
} from "./useTestModelHandler/manageGql";
import * as manageGql from "./useTestModelHandler/manageGql";
import type {
    IReadGetTestEntryVariables,
    IReadListTestEntryVariables
} from "./useTestModelHandler/readGql";
import * as readGql from "./useTestModelHandler/readGql";

import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { generateAlphaLowerCaseId } from "@webiny/utils";
import type { IMutationParams, IQueryParams } from "~tests/testHelpers/types.js";

export type Variables = Record<string, any>;
export type Headers = Record<string, string>;

interface GqlResponseData {
    data: Record<string, any>;
    error: {
        code: string;
        message: string;
        data: Record<string, any>;
    } | null;
}

interface GqlResponseListData extends Omit<GqlResponseData, "data"> {
    data: Record<string, any>[];
    meta: Record<string, any>;
}

type GqlHandlerInvokeResponse = ReturnType<ReturnType<typeof useGraphQLHandler>["invoke"]>;
const extractGqlResponseData = (response: Awaited<GqlHandlerInvokeResponse>) => {
    const parsedResponseBody = response[0] as Record<string, any>;
    const [gqlOperationName] = Object.keys(parsedResponseBody.data);
    return parsedResponseBody.data[gqlOperationName] as GqlResponseData;
};

const extractGqlResponseListData = (
    gqlHandlerInvokeResponse: Awaited<GqlHandlerInvokeResponse>
) => {
    return extractGqlResponseData(gqlHandlerInvokeResponse) as GqlResponseListData;
};

interface UseTestModelHandlerParams extends GraphQLHandlerParams {
    locale?: string;
}

export const useTestModelHandler = (params: UseTestModelHandlerParams) => {
    const locale = params.locale || "en-US";
    const manageGqlHandler = useGraphQLHandler({ ...params, path: `manage/${locale}` });
    const readGqlHandler = useGraphQLHandler({ ...params, path: `read/${locale}` });

    return {
        read: {
            ...readGqlHandler,
            async getTestEntry(params: IQueryParams<IReadGetTestEntryVariables>) {
                return await readGqlHandler
                    .invoke({
                        body: {
                            query: readGql.GET_TEST_ENTRY,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            },
            async listTestEntries(params?: IQueryParams<IReadListTestEntryVariables>) {
                const result = await readGqlHandler
                    .invoke({
                        body: {
                            query: readGql.LIST_TEST_ENTRIES,
                            variables: params?.variables
                        },
                        headers: params?.headers
                    })
                    
                return extractGqlResponseData(result);
            }
        },
        manage: {
            ...manageGqlHandler,
            async setup() {
                return await setupGroupAndModels({
                    manager: manageGqlHandler,
                    models: ["testModel"]
                });
            },
            async getTestEntry(params: IQueryParams<IManageGetTestEntryVariables>) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.GET_TEST_ENTRY,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            },
            async getTestEntriesByIds(params: IQueryParams<IManageGetTestEntriesByIdsVariables>) {
                return manageGqlHandler.invoke({
                    body: {
                        query: manageGql.GET_TEST_ENTRIES_BY_IDS,
                        variables: params.variables
                    },
                    headers: params.headers
                });
            },
            async listTestEntries(params?: IQueryParams<IManageListTestEntryVariables>) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.LIST_TEST_ENTRIES,
                            variables: params?.variables
                        },
                        headers: params?.headers
                    })
                    .then(extractGqlResponseListData);
            },
            async createTestEntry(params: IMutationParams<ICreateTestEntryMutationVariables>) {
                const variables = {
                    ...(params.variables || {})
                };
                const titleSlug = generateAlphaLowerCaseId(10);
                if (!variables?.data?.values?.title) {
                    variables.data = {
                        values: {
                            title: titleSlug,
                            slug: titleSlug
                        }
                    };
                }
                if (!variables?.data?.values?.slug) {
                    variables.data = {
                        ...variables.data,
                        values: {
                            ...variables.data.values,
                            slug: titleSlug
                        }
                    };
                }

                const result = await manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.CREATE_TEST_ENTRY,
                            variables
                        },
                        headers: params.headers
                    });
                
                return extractGqlResponseData(result);
            },
            async createTestEntryFrom(
                params: IMutationParams<ICreateTestEntryFromMutationVariables>
            ) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.CREATE_TEST_ENTRY_FROM,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            },

            async updateTestEntry(params: IMutationParams<IUpdateTestEntryMutationVariables>) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.UPDATE_TEST_ENTRY,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            },

            async moveTestEntry(params: IMutationParams<IMoveTestEntryMutationVariables>) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.MOVE_TEST_ENTRY,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            },

            async deleteTestEntry(params: IMutationParams<IDeleteTestEntryMutationVariables>) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.DELETE_TEST_ENTRY,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            },

            async deleteTestEntries(params: IMutationParams<IDeleteTestEntriesMutationVariables>) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.DELETE_TEST_ENTRIES,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            },
            async publishTestEntry(params: IMutationParams<IPublishTestEntryMutationVariables>) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.PUBLISH_TEST_ENTRY,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            },
            async republishTestEntry(
                params: IMutationParams<IRepublishTestEntryMutationVariables>
            ) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.REPUBLISH_TEST_ENTRY,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            },
            async unpublishTestEntry(
                params: IMutationParams<IUnpublishTestEntryMutationVariables>
            ) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.UNPUBLISH_TEST_ENTRY,
                            variables: params.variables
                        },
                        headers: params.headers
                    })
                    .then(extractGqlResponseData);
            }
        }
    };
};
