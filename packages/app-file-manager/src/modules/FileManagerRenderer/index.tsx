import React from "react";
import { FileManagerViewConfig as FileManagerConfig } from "~/index";
import { FileManagerRenderer } from "./FileManagerView";
import { FilterByType } from "./filters/FilterByType";
import { ActionDelete, ActionEdit, ActionMove } from "~/components/BulkActions";
import { Name } from "~/components/FileDetails/components/Name";
import { Tags } from "~/components/FileDetails/components/Tags";
import { Aliases } from "~/components/FileDetails/components/Aliases";
import {
    CellActions,
    CellAuthor,
    CellModified,
    CellName,
    CellSize,
    CellType
} from "~/components/Table";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";

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
                <Browser.Table.Column
                    name={"name"}
                    header={"Name"}
                    cell={<CellName />}
                    sortable={true}
                    size={400}
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
                    name={"savedOn"}
                    header={"Modified"}
                    cell={<CellModified />}
                    sortable={true}
                />
                <Browser.Table.Column
                    name={"actions"}
                    header={" "}
                    cell={<CellActions />}
                    size={60}
                    className={"rmwc-data-table__cell--align-end"}
                    resizable={false}
                />
                <FileDetails.Field name={"name"} element={<Name />} />
                <FileDetails.Field name={"tags"} element={<Tags />} />
                <FileDetails.Field name={"aliases"} element={<Aliases />} />
            </FileManagerConfig>
        </>
    );
};
