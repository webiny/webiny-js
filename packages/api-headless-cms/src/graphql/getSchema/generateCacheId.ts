import type { ApiEndpoint } from "~/types/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { CmsGraphQLSchemaVariant } from "~/features/graphql/index.js";

interface GenerateCacheIdParams {
    type: ApiEndpoint;
    getTenant: () => Tenant;
    variant?: CmsGraphQLSchemaVariant.Interface;
}

export const generateCacheId = (params: GenerateCacheIdParams): string => {
    const { getTenant, type, variant } = params;
    const parts = [`tenant:${getTenant().id}`, `endpoint:${type}`];
    if (variant) {
        parts.push(`variant:${variant.name}`);
    }
    return parts.join("#");
};
