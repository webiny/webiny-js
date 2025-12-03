import React from "react";
import { FileDropArea } from "../FileDropArea/index.js";

export const FileDropPlaceholder = () => {
    return (
        <div className={"absolute top-0 left-0 bottom-0 right-0 animate-in fade-in duration-300"}>
            <FileDropArea
                title={"Drop files here"}
                description={"Upload files from your computer by dropping them here"}
            />
        </div>
    );
};
