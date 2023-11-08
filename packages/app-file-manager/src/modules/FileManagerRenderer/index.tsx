import React from "react";
import { FileManagerViewConfig as FileManagerConfig } from "~/index";
import { FileManagerRenderer } from "./FileManagerView";
import { FilterByType } from "./filters/FilterByType";
import { ActionDelete, ActionMove } from "~/components/BulkActions";
import { Name } from "~/components/FileDetails/components/Name";
import { Tags } from "~/components/FileDetails/components/Tags";
import { Aliases } from "~/components/FileDetails/components/Aliases";
import { AcoListConfig, DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";

const { Browser, FileDetails } = FileManagerConfig;
const { Folder } = AcoListConfig;

export const FileManagerRendererModule = () => {
    return (
        <>
            <FileManagerRenderer />
            <FileManagerConfig>
                <Browser.FilterByTags />
                <Browser.Filter name={"type"} element={<FilterByType />} />
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
                <FileDetails.Field name={"name"} element={<Name />} />
                <FileDetails.Field name={"tags"} element={<Tags />} />
                <FileDetails.Field name={"aliases"} element={<Aliases />} />
            </FileManagerConfig>
            <AcoListConfig>
                <Folder.Action name={"edit"} element={<EditFolder />} />
                <Folder.Action name={"permissions"} element={<SetFolderPermissions />} />
                <Folder.Action name={"delete"} element={<DeleteFolder />} />
            </AcoListConfig>
        </>
    );
};
