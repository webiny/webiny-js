import type { ApiEndpoint } from "~/types/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

interface GenerateCacheIdParams {
    type: ApiEndpoint;
    getTenant: () => Tenant;
}

export const generateCacheId = (params: GenerateCacheIdParams): string => {
    const { getTenant, type } = params;
    return [`tenant:${getTenant().id}`, `endpoint:${type}`].join("#");
};
