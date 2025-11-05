import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin.js";
import type { ApiEndpoint } from "~/types/index.js";

enum HeaderKeys {
    TYPE = "x-webiny-cms-endpoint"
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

        if (!type) {
            return null;
        }

        return {
            type: type as ApiEndpoint
        };
    });
};
