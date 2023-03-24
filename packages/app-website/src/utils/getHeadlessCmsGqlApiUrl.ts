import { getApiUrl } from "./getApiUrl";
import { getLocaleCode } from "./getLocaleCode";

export const getHeadlessCmsGqlApiUrl = () => {
    const locale = getLocaleCode();
    return {
        preview: getApiUrl(`/cms/preview/${locale}`),
        read: getApiUrl(`/cms/read/${locale}`),
        manage: getApiUrl(`/cms/manage/${locale}`)
    };
};
