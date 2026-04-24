import type * as React from "react";
import type { Plugin } from "@webiny/plugins/types.js";
import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";

export type { FileInput } from "./modules/FileManagerApiProvider/graphql.js";

export type PermissionRendererPluginRenderFunctionType = (props: {
    value: Identity.Permission;
    setValue: (newValue: Identity.Permission) => void;
}) => React.ReactElement<any>;

export type PermissionRendererFileManager = Plugin & {
    type: "permission-renderer-file-manager";
    key: string;
    label: string;
    render: PermissionRendererPluginRenderFunctionType;
};

export interface Settings {
    uploadMinFileSize: string;
    uploadMaxFileSize: string;
    srcPrefix: string;
}
export interface QueryGetSettingsResult {
    fileManager: {
        getSettings: {
            data: Settings;
            error: Error | null;
        };
    };
}

export interface FileTag {
    tag: string;
    count: number;
}

export type TableItem = FolderTableRow | RecordTableRow<FileItem>;

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
