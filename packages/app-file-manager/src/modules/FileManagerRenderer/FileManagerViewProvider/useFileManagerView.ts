import { useContext } from "react";
import { FileManagerViewContext, FileManagerViewContextData } from "./FileManagerViewContext";
import { FileItem } from "@webiny/app-admin/types";

export function useFileManagerView<TFileItem extends FileItem = FileItem>() {
    const context = useContext<FileManagerViewContextData<TFileItem>>(
        FileManagerViewContext as unknown as React.Context<FileManagerViewContextData<TFileItem>>
    );
    if (!context) {
        throw new Error("useFileManagerView() must be used within a FileManagerViewProvider");
    }

    return context;
}
