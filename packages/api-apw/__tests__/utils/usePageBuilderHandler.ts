import {
    createPageBuilderGQLHandler,
    GQLHandlerCallableParams
} from "./createPageBuilderGQLHandler";

export const usePageBuilderHandler = (params: GQLHandlerCallableParams) => {
    return createPageBuilderGQLHandler({
        ...params,
        plugins: params.plugins || []
    });
};
