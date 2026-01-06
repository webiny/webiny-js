import type { Role, SecurityPermission } from "~/types/security.js";

export type { Role };

export interface CreateRoleInput {
    name: string;
    slug: string;
    description: string;
    permissions: SecurityPermission[];
    system?: boolean;
}

export interface UpdateRoleInput {
    name?: string;
    slug?: string;
    description?: string;
    permissions?: SecurityPermission[];
}

export type GetRoleInput = { id: string; slug?: never } | { id?: never; slug: string };

export interface ListRolesInput {
    where?: {
        id_in?: string[];
        slug_in?: string[];
    };
    sort?: string[];
}
