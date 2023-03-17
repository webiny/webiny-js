import React from "react";
import { FileManagerApiContext } from "./FileManagerApiContext";

export function useFileManagerApi() {
    const context = React.useContext(FileManagerApiContext);
    if (!context) {
        throw new Error("useFileManager must be used within a FileManagerProvider");
    }

    return context;
}
