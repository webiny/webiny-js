import React from "react";
import { Wcp } from "@webiny/app-admin";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import { FileManagerViewConfig as FileManagerConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { FilterByType } from "~/presentation/FileList/components/Filters/FilterByType.js";
import {
    BulkActionDelete,
    BulkActionEdit,
    BulkActionMove
} from "~/presentation/FileList/components/BulkActions/index.js";
import { Tags, AccessControl } from "~/presentation/config/fields/index.js";
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
} from "~/presentation/FileList/components/Table/index.js";
import { GridItemDefaultRenderer } from "~/presentation/config/thumbnailRenderers/GridItemDefaultRenderer.js";
import { GridItemImageRenderer } from "~/presentation/config/thumbnailRenderers/GridItemImageRenderer.js";
import { FileActions } from "~/presentation/FileActions/index.js";
import { FilePreviewImageRenderer } from "~/presentation/config/thumbnailRenderers/FilePreviewImageRenderer.js";
import { TableItemDefaultRenderer } from "~/presentation/config/thumbnailRenderers/TableItemDefaultRenderer.js";
import { TableItemImageRenderer } from "~/presentation/config/thumbnailRenderers/TableItemImageRenderer.js";
import { FilePreviewDefaultRenderer } from "~/presentation/config/thumbnailRenderers/FilePreviewDefaultRenderer.js";

const { Browser, FileDetails } = FileManagerConfig;

export const DefaultFileManagerConfig = () => {
    return (
        <FileManagerConfig>
            {/* Filters */}
            <Browser.FilterByTags />
            <Browser.Filter name={"type"} element={<FilterByType />} />
            {/* Bulk Actions */}
            <Browser.BulkAction name={"edit"} element={<BulkActionEdit />} />
            <Browser.BulkAction name={"move"} element={<BulkActionMove />} />
            <Browser.BulkAction name={"delete"} element={<BulkActionDelete />} />
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
                truncate={false}
                className={"flex justify-center"}
                hideable={false}
                resizable={false}
            />
            <Browser.BulkEditField name={"tags"} element={<Tags />} />
            {/* File Details Actions */}
            <FileActions />
            {/* Access Control */}
            <Wcp.CanUsePrivateFiles>
                <Browser.BulkEditField
                    name={"accessControl"}
                    element={<AccessControl placeholder={"Select privacy settings"} />}
                />
            </Wcp.CanUsePrivateFiles>
            {/* Grid Thumbnail */}
            <Browser.Grid.Item.Thumbnail type={"*/*"} element={<GridItemDefaultRenderer />} />
            <Browser.Grid.Item.Thumbnail type={"image/*"} element={<GridItemImageRenderer />} />
            {/* Table Thumbnail */}
            <Browser.Table.Cell.Thumbnail type={"image/*"} element={<TableItemImageRenderer />} />
            <Browser.Table.Cell.Thumbnail type={"*/*"} element={<TableItemDefaultRenderer />} />
            {/* File Details Thumbnail */}
            <FileDetails.Preview.Thumbnail type={"*/*"} element={<FilePreviewDefaultRenderer />} />
            <FileDetails.Preview.Thumbnail
                type={"image/*"}
                element={<FilePreviewImageRenderer />}
            />
        </FileManagerConfig>
    );
};
