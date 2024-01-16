import React from "react";
import { Wcp } from "@webiny/app-admin";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import { FileManagerViewConfig as FileManagerConfig } from "~/index";
import { FileManagerRenderer } from "./FileManagerView";
import { FilterByType } from "./filters/FilterByType";
import { ActionDelete, ActionEdit, ActionMove } from "~/components/BulkActions";
import { Name, Tags, Aliases, AccessControl } from "~/components/fields";
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
} from "~/components/Table";

const { Browser, FileDetails } = FileManagerConfig;

export const FileManagerRendererModule = () => {
    return (
        <>
            <FileManagerRenderer />
            <FileManagerConfig>
                <Browser.FilterByTags />
                <Browser.Filter name={"type"} element={<FilterByType />} />
                <Browser.BulkAction name={"edit"} element={<ActionEdit />} />
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
                <Browser.FolderAction name={"edit"} element={<EditFolder />} />
                <Browser.FolderAction name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.FolderAction name={"delete"} element={<DeleteFolder />} />
                <Browser.FileAction name={"copy"} element={<CopyFile />} />
                <Browser.FileAction name={"edit"} element={<EditFile />} />
                <Browser.FileAction name={"move"} element={<MoveFile />} />
                <Browser.FileAction name={"delete"} element={<DeleteFile />} />
                <Browser.Table.Column
                    name={"name"}
                    header={"Name"}
                    cell={<CellName />}
                    sortable={true}
                    hideable={false}
                    size={300}
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
                    size={80}
                    className={"rmwc-data-table__cell--align-end"}
                    hideable={false}
                    resizable={false}
                />
                <FileDetails.Field name={"name"} element={<Name />} />
                <FileDetails.Field name={"tags"} element={<Tags />} />
                <Browser.BulkEditField name={"tags"} element={<Tags />} />
                <FileDetails.Field name={"aliases"} element={<Aliases />} />
                <Wcp.CanUsePrivateFiles>
                    <FileDetails.Field
                        name={"accessControl"}
                        element={<AccessControl defaultValue={"public"} />}
                    />
                    <Browser.BulkEditField
                        name={"accessControl"}
                        element={<AccessControl placeholder={"Select privacy settings"} />}
                    />
                </Wcp.CanUsePrivateFiles>
                <FileDetails.GroupFields value={false} />
            </FileManagerConfig>
        </>
    );
};
