import type * as React from "react";
import type { Plugin } from "@webiny/plugins/types.js";
import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { FmFile } from "@webiny/sdk";

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

export type FileItem = FmFile;
