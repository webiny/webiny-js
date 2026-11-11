import type { CreatedBy, SecurityPermission } from "~/types/security.js";

export interface ApiKey {
    id: string;
    name: string;
    slug: string;
    description: string;
    token: `wat_${string}`;
    permissions: SecurityPermission[];
    createdBy: CreatedBy;
    createdOn: string;
}

/**
 * An API key as returned by reading use cases (list, get). The `token` is null unless the caller
 * has full access (or runs without authorization), as the token grants the key's permissions.
 */
export type ReadableApiKey = Omit<ApiKey, "token"> & {
    token: ApiKey["token"] | null;
};

export interface CreateApiKeyInput {
    name: string;
    slug: string;
    description: string;
    permissions: SecurityPermission[];
}

export interface UpdateApiKeyInput {
    name?: string;
    description?: string;
    permissions?: SecurityPermission[];
}

export interface ListApiKeysInput {
    sort?: string[];
}
