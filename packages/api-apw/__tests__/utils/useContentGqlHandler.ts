import { GQLHandlerCallableParams, useGqlHandler } from "./useGqlHandler";
import {
    createContentHeadlessCmsContext,
    createContentHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";

export const useContentGqlHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    return useGqlHandler({
        ...params,
        setupTenancyAndSecurityGraphQL: true,
        plugins: (params.plugins || []).concat([createContentHeadlessCmsGraphQL()]),
        createHeadlessCmsApp: createContentHeadlessCmsContext
    });
};
