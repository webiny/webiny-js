import { useGqlHandler } from "./useGqlHandler";
import { PermissionsArgType } from "./helpers";
import { SecurityIdentity } from "@webiny/api-security";
import contentPlugins from "@webiny/api-headless-cms/content";

type GQLHandlerCallableArgsType = {
    permissions?: PermissionsArgType[];
    identity?: SecurityIdentity;
};

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
