import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import * as manageGql from "./useTestModelHandler/manageGql";
import * as readGql from "./useTestModelHandler/readGql";

import { setupContentModelGroup, setupContentModel, getModel } from "~tests/testHelpers/setup";
import { generateAlphaLowerCaseId } from "@webiny/utils";

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
const extractGqlResponseData = (gqlHandlerInvokeResponse: Awaited<GqlHandlerInvokeResponse>) => {
    const parsedResponseBody = gqlHandlerInvokeResponse[0] as Record<string, any>;
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
            async getTestEntry(variables?: Variables, headers?: Headers) {
                return await readGqlHandler
                    .invoke({
                        body: { query: readGql.GET_TEST_ENTRY, variables },
                        headers
                    })
                    .then(extractGqlResponseData);
            },
            async listTestEntries(variables?: Variables, headers?: Headers) {
                return await readGqlHandler
                    .invoke({
                        body: { query: readGql.LIST_TEST_ENTRIES, variables },
                        headers
                    })
                    .then(extractGqlResponseData);
            }
        },
        manage: {
            async setup() {
                const groupId = generateAlphaLowerCaseId(10);

                const group = await setupContentModelGroup(manageGqlHandler, {
                    data: {
                        name: groupId,
                        slug: groupId,
                        icon: {
                            type: "emoji",
                            name: "thumbs_up",
                            value: "👍"
                        },
                        description: groupId
                    }
                });

                const model = await setupContentModel({
                    manager: manageGqlHandler,
                    group,
                    model: getModel("testModel")
                });

                return { group, model };
            },
            async getTestEntry(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: { query: manageGql.GET_TEST_ENTRY, variables },
                        headers
                    })
                    .then(extractGqlResponseData);
            },
            async getTestEntriesByIds(variables?: Variables, headers?: Headers) {
                return manageGqlHandler.invoke({
                    body: { query: manageGql.GET_TEST_ENTRIES_BY_IDS, variables },
                    headers
                });
            },
            async listTestEntries(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: { query: manageGql.LIST_TEST_ENTRIES, variables },
                        headers
                    })
                    .then(extractGqlResponseListData);
            },
            async createTestEntry(variables?: Variables, headers?: Headers) {
                if (!variables || !variables.data) {
                    variables = { data: {} };
                }

                const titleSlug = generateAlphaLowerCaseId(10);
                variables.data.title = variables.data.title || titleSlug;
                variables.data.slug = variables.data.slug || titleSlug;

                return manageGqlHandler
                    .invoke({
                        body: { query: manageGql.CREATE_TEST_ENTRY, variables },
                        headers
                    })
                    .then(extractGqlResponseData);
            },
            async createTestEntryFrom(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: { query: manageGql.CREATE_TEST_ENTRY_FROM, variables },
                        headers
                    })
                    .then(extractGqlResponseData);
            },

            async updateTestEntry(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.UPDATE_TEST_ENTRY,
                            variables
                        },
                        headers
                    })
                    .then(extractGqlResponseData);
            },

            async moveTestEntry(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.MOVE_TEST_ENTRY,
                            variables
                        },
                        headers
                    })
                    .then(extractGqlResponseData);
            },

            async deleteTestEntry(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.DELETE_TEST_ENTRY,
                            variables
                        },
                        headers
                    })
                    .then(extractGqlResponseData);
            },

            async deleteTestEntries(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.DELETE_TEST_ENTRIES,
                            variables
                        },
                        headers
                    })
                    .then(extractGqlResponseData);
            },
            async publishTestEntry(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.PUBLISH_TEST_ENTRY,
                            variables
                        },
                        headers
                    })
                    .then(extractGqlResponseData);
            },
            async republishTestEntry(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.REPUBLISH_TEST_ENTRY,
                            variables
                        },
                        headers
                    })
                    .then(extractGqlResponseData);
            },
            async unpublishTestEntry(variables?: Variables, headers?: Headers) {
                return manageGqlHandler
                    .invoke({
                        body: {
                            query: manageGql.UNPUBLISH_TEST_ENTRY,
                            variables
                        },
                        headers
                    })
                    .then(extractGqlResponseData);
            }
        }
    };
};
