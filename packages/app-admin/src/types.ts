import type { ReactElement } from "react";
import type { Plugin } from "@webiny/plugins/types.js";
import { Identity } from "~/domain/Identity.js";

export type { Icon } from "~/components/IconPicker/types.js";

export type AdminAppPermissionRendererPlugin = Plugin & {
    type: "admin-app-permissions-renderer";
    system?: boolean;
    render(params: any): ReactElement;
};

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
        displayName: string;
    };
    savedOn: string;
    savedBy: {
        id: string;
        displayName: string;
    };
    modifiedOn: string;
    modifiedBy: {
        id: string;
        displayName: string;
    };
    location: {
        folderId: string;
    };
    metadata?: {
        image?: {
            width: number;
            height: number;
            format: string;
            orientation: number;
        };
        exif?: Record<string, any>;
        iptc?: Record<string, any>;
        [key: string]: any;
    };
    accessControl?: {
        type: "public" | "private-authenticated";
    };
    extensions?: Record<string, any>;
}

export interface FileManagerSecurityPermission extends Identity.Permission {
    rwd?: string;
    own?: boolean;
}

export type ComponentWithChildren = React.ComponentType<{ children?: React.ReactNode }>;
