import { ApiEndpoint } from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";

interface GenerateCacheIdParams {
    type: ApiEndpoint;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
}

export const generateCacheId = (params: GenerateCacheIdParams): string => {
    const { getTenant, type, getLocale } = params;
    return [`tenant:${getTenant().id}`, `endpoint:${type}`, `locale:${getLocale().code}`].join("#");
};
