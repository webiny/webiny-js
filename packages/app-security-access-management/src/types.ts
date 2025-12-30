import type { Identity } from "@webiny/app-admin/domain/Identity.js";

export interface Group {
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
    createdOn: string;
}

export interface ApiKey {
    id: string;
    token: string;
    name: string;
    description: string;
    permissions: Identity.Permission[];
    createdOn: string;
}
