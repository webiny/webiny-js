import { GQLHandlerCallableParams, useGqlHandler } from "./useGqlHandler";
import { createAdminHeadlessCms } from "~/plugins";

export const useAdminGqlHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    return useGqlHandler({
        ...params,
        setupTenancyAndSecurityGraphQL: true,
        plugins: [],
        createHeadlessCmsApp: createAdminHeadlessCms
    });
};
