import { SecurityPermission } from "@webiny/app-security/types";

export interface Group {
    id: string;
    name: string;
    description: string;
    slug: string;
    system?: boolean;
}

export interface Team {
    id: string;
    name: string;
    description: string;
    slug: string;
    system?: boolean;
}

export interface ApiKey {
    id: string;
    token: string;
    name: string;
    description: string;
    permissions: SecurityPermission[];
}
