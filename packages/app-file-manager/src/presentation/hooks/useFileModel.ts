import React from "react";
import { FileModelContext } from "~/modules/FileModel/index.js";

export function useFileModel() {
    const context = React.useContext(FileModelContext);
    if (!context) {
        throw Error(`Missing "FileModelContext" in the component tree!`);
    }

    return context;
}
