import React from "react";
import { FileManagerViewConfig } from "~/index";
import { FileManagerRenderer } from "./FileManagerView";
import { FilterByType } from "./filters/FilterByType";

export const FileManagerRendererModule = () => {
    return (
        <>
            <FileManagerRenderer />
            <FileManagerViewConfig>
                <FileManagerViewConfig.Browser.Filter name={"type"} element={<FilterByType />} />
            </FileManagerViewConfig>
        </>
    );
};
