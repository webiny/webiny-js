import React from "react";
import { AcoRenderer } from "./AcoRenderer";

export const FileManagerRendererModule = () => {
    return (
        <>
            <AcoRenderer />
            {/*<FileManagerViewConfig>
                <Browser.Filter name={"type"} element={<FilterByType />} />
                <Browser.Filter name={"createdBy"} element={<span>Filter by: createdBy</span>} />
                <Browser.Filter name={"createdOn"} element={<span>Filter by: createdOn</span>} />
            </FileManagerViewConfig>*/}
        </>
    );
};
