import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin";

const DEFAULT_LOCALE_CODE = "en-US";

export const createContextParameterPlugin = () => {
    return new CmsParametersPlugin(async context => {
        const locale = context.i18n.getContentLocale();
        return {
            locale: locale?.code || DEFAULT_LOCALE_CODE,
            type: null
        };
    });
};
