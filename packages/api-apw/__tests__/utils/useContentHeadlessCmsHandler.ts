import {
    createHeadlessCmsGQLHandler,
    CreateHeadlessCmsGQLHandlerParams
} from "./createHeadlessCmsGQLHandler";

export const useContentHeadlessCmsHandler = (params: CreateHeadlessCmsGQLHandlerParams) => {
    return createHeadlessCmsGQLHandler({
        ...params,
        plugins: params.plugins || []
    });
};
