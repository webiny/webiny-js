import { SecurityPermission } from "@webiny/app-security/types";

export interface Group {
    id: string;
    name: string;
    description: string;
    slug: string;
}
export interface ApiKey {
    id: string;
    token: string;
    name: string;
    description: string;
    permissions: SecurityPermission[];
}
