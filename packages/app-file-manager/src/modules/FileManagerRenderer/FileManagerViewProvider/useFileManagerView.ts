import { useContext } from "react";
import { FileManagerViewContext } from "./FileManagerViewContext.js";
import type { FileItem } from "~/types.js";

export function useFileManagerView<TFileItem extends FileItem = FileItem>() {
    const context = useContext<FileManagerViewContext<TFileItem>>(
        FileManagerViewContext as unknown as React.Context<FileManagerViewContext<TFileItem>>
    );
    if (!context) {
        throw new Error("useFileManagerView() must be used within a FileManagerViewProvider");
    }

    return context;
}
