import React from "react";
import { FileDropArea } from "../FileDropArea/index.js";

export const FileDropPlaceholder = () => {
    return (
        <div className={"absolute inset-0 z-50 animate-in fade-in duration-300"}>
            <FileDropArea
                title={"Drop files here"}
                description={"Upload files from your computer by dropping them here"}
            />
        </div>
    );
};
