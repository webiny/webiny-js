import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { SecurityPermission } from "@webiny/app-security/types";
import { FileItem } from "@webiny/app-admin/types";
import { FolderTableItem, RecordTableItem } from "@webiny/app-aco/types";

export { FileInput } from "./modules/FileManagerApiProvider/graphql";

export type PermissionRendererPluginRenderFunctionType = (props: {
    value: SecurityPermission;
    setValue: (newValue: SecurityPermission) => void;
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

export type FileTableItem = FileItem & RecordTableItem;

export type TableItem = FolderTableItem | FileTableItem;
