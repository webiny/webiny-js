import { FileItem } from "@webiny/app-admin/types";
import React from "react";
import { FileManagerApiContext, FileManagerApiContextData } from "./FileManagerApiContext";

export function useFileManagerApi<TFileItem extends FileItem = FileItem>() {
    const context = React.useContext<FileManagerApiContextData<TFileItem>>(
        FileManagerApiContext as unknown as React.Context<FileManagerApiContextData<TFileItem>>
    );

    if (!context) {
        throw new Error("useFileManager must be used within a FileManagerProvider");
    }

    return context;
}
