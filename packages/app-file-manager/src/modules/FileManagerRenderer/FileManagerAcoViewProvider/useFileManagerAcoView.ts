import { useContext } from "react";
import {
    FileManagerAcoViewContext,
    FileManagerAcoViewContextData
} from "./FileManagerAcoViewContext";
import { FileItem } from "@webiny/app-admin/types";

export function useFileManagerAcoView<TFileItem extends FileItem = FileItem>() {
    const context = useContext<FileManagerAcoViewContextData<TFileItem>>(
        FileManagerAcoViewContext as unknown as React.Context<
            FileManagerAcoViewContextData<TFileItem>
        >
    );
    if (!context) {
        throw new Error("useFileManagerAcoView() must be used within a FileManagerAcoViewProvider");
    }

    return context;
}
