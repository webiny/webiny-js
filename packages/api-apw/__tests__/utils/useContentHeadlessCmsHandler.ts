import {
    createContentHeadlessCmsContext,
    createContentHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";
import {
    createHeadlessCmsGQLHandler,
    CreateHeadlessCmsGQLHandlerParams
} from "./createHeadlessCmsGQLHandler";

export const useContentHeadlessCmsHandler = (
    params: Omit<CreateHeadlessCmsGQLHandlerParams, "createHeadlessCmsApp">
) => {
    return createHeadlessCmsGQLHandler({
        ...params,
        plugins: (params.plugins || []).concat([createContentHeadlessCmsGraphQL()]),
        createHeadlessCmsApp: createContentHeadlessCmsContext
    });
};
