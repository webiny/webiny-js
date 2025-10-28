import { getLocale } from "@webiny/api-core/legacy/i18n/getLocale.js";
import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin.js";

export const createContextParameterPlugin = () => {
    return new CmsParametersPlugin(async () => {
        const locale = getLocale();
        return {
            locale: locale?.code,
            type: null
        };
    });
};
