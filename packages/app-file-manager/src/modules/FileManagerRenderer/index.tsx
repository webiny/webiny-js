import React from "react";
import { FileManagerViewConfig as FileManagerConfig } from "~/index";
import { FileManagerRenderer } from "./FileManagerView";
import { FilterByType } from "./filters/FilterByType";
import { ActionDelete, ActionMove } from "~/components/BulkActions";
import { Name } from "~/components/FileDetails/components/Name";
import { Tags } from "~/components/FileDetails/components/Tags";
import { Aliases } from "~/components/FileDetails/components/Aliases";

const { Browser, FileDetails } = FileManagerConfig;

export const FileManagerRendererModule = () => {
    return (
        <>
            <FileManagerRenderer />
            <FileManagerConfig>
                <Browser.FilterByTags />
                <Browser.Filter name={"type"} element={<FilterByType />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <FileDetails.Field name={"name"} element={<Name />} />
                <FileDetails.Field name={"tags"} element={<Tags />} />
                <FileDetails.Field name={"aliases"} element={<Aliases />} />
            </FileManagerConfig>
        </>
    );
};
