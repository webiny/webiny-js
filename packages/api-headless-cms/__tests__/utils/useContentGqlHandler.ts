import { GQLHandlerCallableParams, useGqlHandler } from "./useGqlHandler";
import { createContentHeadlessCms } from "~/content";

export const useContentGqlHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    return useGqlHandler({
        ...params,
        setupTenancyAndSecurityGraphQL: false,
        createHeadlessCmsApp: createContentHeadlessCms
    });
};
