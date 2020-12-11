import { GQLHandlerCallableArgsType, useGqlHandler } from "./useGqlHandler";
import contentPlugins from "@webiny/api-headless-cms/content";

export const useContentGqlHandler = (args: GQLHandlerCallableArgsType = {}) => {
    return useGqlHandler({
        ...args,
        plugins: [
            contentPlugins({
                debug: true
            })
        ]
    });
};
