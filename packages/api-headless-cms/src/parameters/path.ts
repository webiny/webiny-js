import WebinyError from "@webiny/error";
import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin";
import { ApiEndpoint } from "~/types";

const allowedEndpoints: ApiEndpoint[] = ["manage", "read", "preview"];

export const createPathParameterPlugin = () => {
    return new CmsParametersPlugin(async context => {
        /**
         * If any of the properties is not defined, just ignore this plugin
         */
        if (!context.http?.request?.path?.parameters) {
            return null;
        }

        const { key } = context.http.request.path.parameters;
        if (typeof key !== "string") {
            throw new WebinyError(
                "The key property in context.http.request.path.parameters is not a string.",
                "MALFORMED_KEY",
                {
                    key
                }
            );
        }
        const [type, locale] = key.split("/");
        if (!type) {
            throw new WebinyError(
                `Missing context.http.request.path.parameters.key parameter "type".`
            );
        } else if (!locale) {
            throw new WebinyError(`Missing context.http.request.path.parameters.key "locale".`);
        } else if (allowedEndpoints.includes(type as ApiEndpoint) === false) {
            throw new WebinyError(`Endpoint "${type}" not allowed!`);
        }

        return {
            type: type as ApiEndpoint,
            locale
        };
    });
};
