import type { ApiEndpoint } from "~/types/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { I18NLocale } from "@webiny/api-core/types/i18n.js";

interface GenerateCacheIdParams {
    type: ApiEndpoint;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
}

export const generateCacheId = (params: GenerateCacheIdParams): string => {
    const { getTenant, type, getLocale } = params;
    return [`tenant:${getTenant().id}`, `endpoint:${type}`, `locale:${getLocale().code}`].join("#");
};
