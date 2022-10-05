import { SecurityPermission } from "@webiny/app-security/types";

/**
 * Represents a file as we receive from the GraphQL API.
 */
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
}

export interface FileManagerSecurityPermission extends SecurityPermission {
    rwd?: string;
    own?: boolean;
}
