import { SecurityPermission } from "@webiny/app-security/types";

export interface FileItem {
    id: string;
    name: string;
    key: string;
    src: string;
    size: number;
    type: string;
    tags: string[];
    createdOn: string;
    createdBy: {
        id: string;
    };
    [key: string]: any;
}

export interface FileManagerSecurityPermission extends SecurityPermission {
    rwd?: string;
    own?: boolean;
}
