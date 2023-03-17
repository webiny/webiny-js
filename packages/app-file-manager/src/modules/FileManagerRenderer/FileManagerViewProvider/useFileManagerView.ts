import { useContext } from "react";
import { FileManagerViewContext } from "./FileManagerViewContext";

export function useFileManagerView() {
    const context = useContext(FileManagerViewContext);
    if (!context) {
        throw new Error("useFileManagerView() must be used within a FileManagerViewProvider");
    }

    return context;
}
