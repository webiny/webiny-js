import {
    createPageBuilderGQLHandler,
    GQLHandlerCallableParams
} from "./createPageBuilderGQLHandler";
import { createContentHeadlessCmsContext } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";

export const usePageBuilderHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    return createPageBuilderGQLHandler({
        ...params,
        plugins: (params.plugins || []).concat([graphQLHandlerPlugins()]),
        createHeadlessCmsApp: createContentHeadlessCmsContext
    });
};
