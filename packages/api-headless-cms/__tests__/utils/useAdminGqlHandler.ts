import { GQLHandlerCallableArgs, useGqlHandler } from "./useGqlHandler";
import { createAdminHeadlessCms } from "~/plugins";

export const useAdminGqlHandler = (args: GQLHandlerCallableArgs) => {
    return useGqlHandler({
        ...args,
        path: args.path || "",
        setupTenancyAndSecurityGraphQL: true,
        plugins: [],
        createHeadlessCmsApp: createAdminHeadlessCms
    });
};
