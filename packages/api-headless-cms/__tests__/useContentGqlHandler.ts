import { useGqlHandler } from "./useGqlHandler";
import { PermissionsArgType } from "./helpers";
import { SecurityIdentity } from "@webiny/api-security";
import { graphQLHandlerFactory } from "@webiny/api-headless-cms/content/graphQLHandlerFactory";

type GQLHandlerCallableArgsType = {
    permissions?: PermissionsArgType[];
    identity?: SecurityIdentity;
};

export const useContentGqlHandler = (args: GQLHandlerCallableArgsType = {}) => {
    return useGqlHandler({
        ...args,
        plugins: [
            graphQLHandlerFactory({
                debug: true
            })
        ]
    });
};
