import WebinyError from "@webiny/error";
import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin";

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
        }

        return {
            type,
            locale
        };
    });
};
