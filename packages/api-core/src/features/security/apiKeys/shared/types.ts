import type { CreatedBy, SecurityPermission } from "~/types/security.js";

export interface ApiKey {
    id: string;
    name: string;
    slug: string;
    description: string;
    token: string;
    permissions: SecurityPermission[];
    createdBy: CreatedBy;
    createdOn: string;
}

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
