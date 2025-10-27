import type { Group, SecurityPermission } from "~/types.js";

export type { Group };

export interface CreateGroupInput {
    name: string;
    slug: string;
    description: string;
    permissions: SecurityPermission[];
    system?: boolean;
}

export interface UpdateGroupInput {
    name?: string;
    slug?: string;
    description?: string;
    permissions?: SecurityPermission[];
}

export interface GetGroupInput {
    id?: string;
    slug?: string;
}

export interface ListGroupsInput {
    where?: {
        id_in?: string[];
        slug_in?: string[];
    };
    sort?: string[];
}
