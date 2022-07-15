import graphQLHandlerPlugins from "@webiny/handler-graphql";
import {
    createHeadlessCmsGQLHandler,
    CreateHeadlessCmsGQLHandlerParams
} from "./createHeadlessCmsGQLHandler";

export const useAdminHeadlessCmsHandler = (params: CreateHeadlessCmsGQLHandlerParams) => {
    return createHeadlessCmsGQLHandler({
        ...params,
        plugins: (params.plugins || []).concat([graphQLHandlerPlugins()])
    });
};
