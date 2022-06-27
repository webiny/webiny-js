import graphQLHandlerPlugins from "@webiny/handler-graphql";
import {
    createAdminHeadlessCmsContext,
    createAdminHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";
import {
    createHeadlessCmsGQLHandler,
    CreateHeadlessCmsGQLHandlerParams
} from "./createHeadlessCmsGQLHandler";

export const useAdminHeadlessCmsHandler = (
    params: Omit<CreateHeadlessCmsGQLHandlerParams, "createHeadlessCmsApp">
) => {
    return createHeadlessCmsGQLHandler({
        ...params,
        plugins: (params.plugins || []).concat([
            graphQLHandlerPlugins(),
            createAdminHeadlessCmsGraphQL()
        ]),
        createHeadlessCmsApp: createAdminHeadlessCmsContext
    });
};
