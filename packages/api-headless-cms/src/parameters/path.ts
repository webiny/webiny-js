import WebinyError from "@webiny/error";
import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin";
import { ApiEndpoint } from "~/types";

const allowedEndpoints: ApiEndpoint[] = ["manage", "read", "preview"];

export const createPathParameterPlugin = () => {
    return new CmsParametersPlugin(async context => {
        /**
         * If any of the properties is not defined, just ignore this plugin
         */
        if (!context.request?.params) {
            return null;
        }

        const { type, locale } = context.request.params as Record<string, string | null>;
        if (!type && !locale) {
            return null;
        }

        if (!type) {
            throw new WebinyError(`Missing request parameter "type".`);
        } else if (!locale) {
            throw new WebinyError(`Missing request parameter "locale".`);
        } else if (allowedEndpoints.includes(type as ApiEndpoint) === false) {
            throw new WebinyError(`Endpoint "${type}" not allowed!`);
        }

        return {
            type: type as ApiEndpoint,
            locale
        };
    });
};
