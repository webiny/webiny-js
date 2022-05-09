import WebinyError from "@webiny/error";
import { CmsParametersPlugin } from "@webiny/api-headless-cms";

export const createManageCMSPlugin = (): CmsParametersPlugin => {
    return new CmsParametersPlugin(async context => {
        const locale = context.i18n.getContentLocale();

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
