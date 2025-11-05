import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin.js";
import type { ApiEndpoint } from "~/types/index.js";

export const createPathParameterPlugin = () => {
    return new CmsParametersPlugin(async context => {
        /**
         * If any of the properties is not defined, just ignore this plugin
         */
        if (!context.request?.params) {
            return null;
        }

        const { type } = context.request.params as Record<string, string | null>;

        if (!type) {
            return null;
        }

        return {
            type: type as ApiEndpoint
        };
    });
};
