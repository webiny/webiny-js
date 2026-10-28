import type { ApiEndpoint } from "~/types/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { CmsGraphQLCompat } from "../compat/types.js";

interface GenerateCacheIdParams {
    type: ApiEndpoint;
    getTenant: () => Tenant;
    compat?: CmsGraphQLCompat;
}

export const generateCacheId = (params: GenerateCacheIdParams): string => {
    const { getTenant, type, compat } = params;
    const parts = [`tenant:${getTenant().id}`, `endpoint:${type}`];
    if (compat) {
        parts.push(`compat:${compat}`);
    }
    return parts.join("#");
};
