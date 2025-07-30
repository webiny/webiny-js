import {
    type GraphQLHandlerParams,
    useGraphQLHandler
} from "~tests/testHelpers/useGraphQLHandler.js";
import type { CmsEntryListParams } from "~/types/index.js";
import {
    createGetQuery,
    createListQuery
} from "~tests/__helpers/handler/authorWithSearchableJson/graphql/queries.read.js";
import { createDefaultGroup } from "~tests/__helpers/groups/defaultGroup.js";
import { createAuthorWithSearchableJson } from "~tests/__helpers/models/authorWithSearchableJson.js";

export const useAuthorWithSearchableJsonReader = (params?: GraphQLHandlerParams) => {
    const modelPlugin = createAuthorWithSearchableJson();
    const contentHandler = useGraphQLHandler({
        path: "read/en-US",
        plugins: [createDefaultGroup(), modelPlugin],
        ...params
    });

    return {
        ...contentHandler,
        async getAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: createGetQuery(modelPlugin.contentModel),
                    variables
                },
                headers
            });
        },
        async listAuthors(variables: CmsEntryListParams = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: createListQuery(modelPlugin.contentModel),
                    variables
                },
                headers
            });
        }
    };
};
