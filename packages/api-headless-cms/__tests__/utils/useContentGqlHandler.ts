import { GQLHandlerCallableArgs, useGqlHandler } from "./useGqlHandler";
import { Plugin } from "@webiny/plugins/types";
import { createContentHeadlessCms } from "~/content";

export const useContentGqlHandler = (args: GQLHandlerCallableArgs, plugins: Plugin[] = []) => {
    return useGqlHandler({
        ...args,
        setupTenancyAndSecurityGraphQL: false,
        plugins,
        createHeadlessCmsApp: createContentHeadlessCms
    });
};
