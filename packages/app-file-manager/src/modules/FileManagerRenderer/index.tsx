import React from "react";
import { Wcp } from "@webiny/app-admin";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import { FileManagerViewConfig as FileManagerConfig } from "~/index.js";
import { FileManagerRenderer } from "./FileManagerView/index.js";
import { FilterByType } from "./filters/FilterByType.js";
import { ActionDelete, ActionEdit, ActionMove } from "~/components/BulkActions/index.js";
import { Name, Tags, Aliases, AccessControl } from "~/components/fields/index.js";
import {
    CellActions,
    CellAuthor,
    CellCreated,
    CellModified,
    CellName,
    CellSize,
    CellType,
    CopyFile,
    DeleteFile,
    EditFile,
    MoveFile
} from "~/components/Table/index.js";
import { GridItemDefaultRenderer } from "~/modules/ThumbnailRenderers/GridItemDefaultRenderer.js";
import { GridItemImageRenderer } from "~/modules/ThumbnailRenderers/GridItemImageRenderer.js";
import { FileActions } from "~/modules/FileManagerRenderer/FileActions/index.js";
import { FilePreviewImageRenderer } from "~/modules/ThumbnailRenderers/FilePreviewImageRenderer.js";
import { TableItemDefaultRenderer } from "~/modules/ThumbnailRenderers/TableItemDefaultRenderer.js";
import { TableItemImageRenderer } from "~/modules/ThumbnailRenderers/TableItemImageRenderer.js";
import { FilePreviewDefaultRenderer } from "~/modules/ThumbnailRenderers/FilePreviewDefaultRenderer.js";

const { Browser, FileDetails } = FileManagerConfig;

export const FileManagerRendererModule = () => {
    return (
        <>
            <FileManagerRenderer />
            <FileManagerConfig>
                {/* Filters */}
                <Browser.FilterByTags />
                <Browser.Filter name={"type"} element={<FilterByType />} />
                {/* Bulk Actions */}
                <Browser.BulkAction name={"edit"} element={<ActionEdit />} />
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
                {/* Folder Actions */}
                <Browser.Folder.Action name={"edit"} element={<EditFolder />} />
                <Browser.Folder.Action name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.Folder.Action name={"delete"} element={<DeleteFolder />} />
                {/* File Actions */}
                <Browser.File.Action name={"copy"} element={<CopyFile />} />
                <Browser.File.Action name={"edit"} element={<EditFile />} />
                <Browser.File.Action name={"move"} element={<MoveFile />} />
                <Browser.File.Action name={"delete"} element={<DeleteFile />} />
                {/* Table Columns */}
                <Browser.Table.Column
                    name={"name"}
                    header={"Name"}
                    cell={<CellName />}
                    sortable={true}
                    hideable={false}
                    size={200}
                />
                <Browser.Table.Column name={"type"} header={"Type"} cell={<CellType />} />
                <Browser.Table.Column
                    name={"size"}
                    header={"Size"}
                    cell={<CellSize />}
                    sortable={true}
                />
                <Browser.Table.Column name={"createdBy"} header={"Author"} cell={<CellAuthor />} />
                <Browser.Table.Column
                    name={"createdOn"}
                    header={"Created"}
                    cell={<CellCreated />}
                    sortable={true}
                />
                <Browser.Table.Column
                    name={"savedOn"}
                    header={"Modified"}
                    cell={<CellModified />}
                    sortable={true}
                />
                <Browser.Table.Column
                    name={"actions"}
                    header={" "}
                    cell={<CellActions />}
                    size={56}
                    className={"text-right"}
                    hideable={false}
                    resizable={false}
                />
                {/* File Details Fields */}
                <FileDetails.Field name={"name"} element={<Name />} />
                <FileDetails.Field name={"tags"} element={<Tags />} />
                <Browser.BulkEditField name={"tags"} element={<Tags />} />
                <FileDetails.Field name={"aliases"} element={<Aliases />} />
                <FileDetails.GroupFields value={false} />
                {/* File Details Actions */}
                <FileActions />
                {/* Access Control */}
                <Wcp.CanUsePrivateFiles>
                    <FileDetails.Field
                        name={"accessControl"}
                        element={<AccessControl defaultValue={"public"} />}
                        after={"tags"}
                    />
                    <Browser.BulkEditField
                        name={"accessControl"}
                        element={<AccessControl placeholder={"Select privacy settings"} />}
                    />
                </Wcp.CanUsePrivateFiles>
                {/* Grid Thumbnail */}
                <Browser.Grid.Item.Thumbnail type={"*/*"} element={<GridItemDefaultRenderer />} />
                <Browser.Grid.Item.Thumbnail type={"image/*"} element={<GridItemImageRenderer />} />
                {/* Table Thumbnail */}
                <Browser.Table.Cell.Thumbnail
                    type={"image/*"}
                    element={<TableItemImageRenderer />}
                />
                <Browser.Table.Cell.Thumbnail type={"*/*"} element={<TableItemDefaultRenderer />} />
                {/* File Details Thumbnail */}
                <FileDetails.Preview.Thumbnail
                    type={"*/*"}
                    element={<FilePreviewDefaultRenderer />}
                />
                <FileDetails.Preview.Thumbnail
                    type={"image/*"}
                    element={<FilePreviewImageRenderer />}
                />
            </FileManagerConfig>
        </>
    );
};
