import React, { createContext } from "react";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { FileItem } from "@webiny/app-admin/types";

export interface FileDetailsContext {
    close: () => void;
    setFile: (file: FileItem) => void;
    own: boolean;
    scope?: string;
}

export const FileDetailsContext = createContext<FileDetailsContext | undefined>(undefined);

interface FileDetailsProviderProps {
    hideFileDetails: () => void;
    onSetFile: (file: FileItem) => void;
    children: React.ReactNode;
}

export const FileDetailsProvider = ({
    hideFileDetails,
    onSetFile,
    children
}: FileDetailsProviderProps) => {
    const view = useFileManagerView();

    const value: FileDetailsContext = {
        close: hideFileDetails,
        scope: view.scope,
        own: view.own,
        setFile: onSetFile
    };

    return <FileDetailsContext.Provider value={value}>{children}</FileDetailsContext.Provider>;
};
