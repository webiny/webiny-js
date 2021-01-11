import { GQLHandlerCallableArgs, useGqlHandler } from "./useGqlHandler";
import contentPlugins from "../../src/content";

export const useContentGqlHandler = (args: GQLHandlerCallableArgs) => {
    return useGqlHandler({
        ...args,
        plugins: contentPlugins({
            debug: true
        })
    });
};
