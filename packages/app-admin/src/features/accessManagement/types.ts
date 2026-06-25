import type { Identity } from "~/domain/Identity.js";

export interface Role {
    id: string;
    name: string;
    description: string;
    slug: string;
    system?: boolean;
    plugin: boolean | null;
    permissions: Identity.Permission[];
    createdOn: string;
}

export interface Team {
    id: string;
    name: string;
    description: string;
    slug: string;
    system?: boolean;
    plugin: boolean | null;
    roles?: { id: string; slug: string; name: string }[];
    createdOn: string;
}

export interface ApiKey {
    id: string;
    slug: string;
    token: string;
    name: string;
    description: string;
    permissions: Identity.Permission[];
    createdOn: string;
}
