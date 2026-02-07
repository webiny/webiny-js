import type { FileItem } from "~/types.js";
import React from "react";
import type { FileManagerApiContextData } from "./FileManagerApiContext.js";
import { FileManagerApiContext } from "./FileManagerApiContext.js";

export function useFileManagerApi<TFileItem extends FileItem = FileItem>() {
    const context = React.useContext<FileManagerApiContextData<TFileItem>>(
        FileManagerApiContext as unknown as React.Context<FileManagerApiContextData<TFileItem>>
    );

    if (!context) {
        throw new Error("useFileManager must be used within a FileManagerProvider");
    }

    return context;
}
