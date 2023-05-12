import WebinyError from "@webiny/error";
import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin";
import { ApiEndpoint } from "~/types";

enum HeaderKeys {
    TYPE = "x-webiny-cms-endpoint",
    LOCALE = "x-webiny-cms-locale"
}

export const createHeaderParameterPlugin = () => {
    return new CmsParametersPlugin(async context => {
        /**
         * If any of the properties is not defined, just ignore this plugin
         */
        if (!context.request?.headers) {
            return null;
        }

        const headers = context.request.headers;

        const type = headers[HeaderKeys.TYPE];
        const locale = headers[HeaderKeys.LOCALE];

        if (!type && !locale) {
            return null;
        } else if (!locale || typeof locale !== "string") {
            throw new WebinyError(
                `There is a "${HeaderKeys.TYPE}" header but no "${HeaderKeys.LOCALE}".`,
                "MALFORMED_HEADERS_ERROR",
                {
                    headers
                }
            );
        } else if (!type || typeof type !== "string") {
            throw new WebinyError(
                `There is a "${HeaderKeys.LOCALE}" header but no "${HeaderKeys.TYPE}".`,
                "MALFORMED_HEADERS_ERROR",
                {
                    headers
                }
            );
        }

        return {
            type: type as ApiEndpoint,
            locale
        };
    });
};
