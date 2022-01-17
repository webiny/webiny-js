import { GQLHandlerCallableParams, useGqlHandler } from "./useGqlHandler";
import {
    CmsParametersPlugin,
    createAdminHeadlessCmsContext,
    createContentHeadlessCmsContext,
    createContentHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";
import WebinyError from "@webiny/error";

const createManageCMSPlugin = (): CmsParametersPlugin => {
    return new CmsParametersPlugin(async context => {
        const locale = context.i18n.getCurrentLocale("content");

        if (!locale) {
            throw new WebinyError(`Could not able to load "locale".`, "MALFORMED_LOCALE", {
                locale
            });
        }

        return {
            type: "manage",
            locale: locale.code
        };
    });
};

export const useContentGqlHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    return useGqlHandler({
        ...params,
        setupTenancyAndSecurityGraphQL: true,
        plugins: (params.plugins || []).concat([createContentHeadlessCmsGraphQL()]),
        createHeadlessCmsApp: params => {
            const plugins = createContentHeadlessCmsContext(params);

            return [
                createManageCMSPlugin(),
                ...plugins,
                createAdminHeadlessCmsContext({
                    storageOperations: params.storageOperations
                })
            ];
        }
    });
};
