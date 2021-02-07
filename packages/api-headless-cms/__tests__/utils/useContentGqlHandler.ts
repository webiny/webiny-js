import { GQLHandlerCallableArgs, useGqlHandler } from "./useGqlHandler";
import { Plugin } from "@webiny/plugins/types";
import contentPlugins from "../../src/content";

export const useContentGqlHandler = (args: GQLHandlerCallableArgs, plugins: Plugin[] = []) => {
    return useGqlHandler({
        ...args,
        plugins: contentPlugins().concat(plugins)
    });
};
