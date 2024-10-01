import { SecurityPermission } from "@webiny/app-security/types";

export interface Group {
    id: string;
    name: string;
    description: string;
    slug: string;
    system?: boolean;
    plugin: boolean | null;
    permissions: SecurityPermission[];
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
    permissions: SecurityPermission[];
    createdOn: string;
}
