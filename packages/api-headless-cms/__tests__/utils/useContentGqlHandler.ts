import { GQLHandlerCallableParams, useGqlHandler } from "./useGqlHandler";
import { createContentHeadlessCmsContext, createContentHeadlessCmsGraphQL } from "~/index";

export const useContentGqlHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    return useGqlHandler({
        ...params,
        setupTenancyAndSecurityGraphQL: false,
        plugins: (params.plugins || []).concat([createContentHeadlessCmsGraphQL()]),
        createHeadlessCmsApp: createContentHeadlessCmsContext
    });
};
