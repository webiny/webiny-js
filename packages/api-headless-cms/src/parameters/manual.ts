/**
 * This would be used for custom Lambdas when there is no path or header information about the endpoint type and locale.
 */
import WebinyError from "@webiny/error";
import {
    CmsParametersPlugin,
    CmsParametersPluginResponseLocale,
    CmsParametersPluginResponseType
} from "~/plugins/CmsParametersPlugin";

export interface ManualPluginParams {
    endpointType?: CmsParametersPluginResponseType;
    locale?: CmsParametersPluginResponseLocale;
}

export const createManualPlugin = (params: ManualPluginParams): CmsParametersPlugin => {
    return new CmsParametersPlugin(async () => {
        const { endpointType: type, locale } = params;
        /**
         * if both of parameters are not existing, just skip this plugin.
         */
        if (!type && !locale) {
            return null;
        } else if (!type) {
            throw new WebinyError(
                `There is defined "locale" CMS parameter but no "endpointType".`,
                "MALFORMED_ENDPOINT_TYPE",
                {
                    ...params
                }
            );
        } else if (!locale) {
            throw new WebinyError(
                `There is defined "endpointType" CMS parameter but no "locale".`,
                "MALFORMED_LOCALE_TYPE",
                {
                    ...params
                }
            );
        }

        return {
            type,
            locale
        };
    });
};
