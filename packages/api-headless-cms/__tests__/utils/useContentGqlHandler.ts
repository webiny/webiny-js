import { GQLHandlerCallableArgsType, useGqlHandler } from "./useGqlHandler";
import contentPlugins from "../../src/content";

export const useContentGqlHandler = (args: GQLHandlerCallableArgsType = {}) => {
    return useGqlHandler({
        ...args,
        plugins: contentPlugins({
            debug: true
        })
    });
};
