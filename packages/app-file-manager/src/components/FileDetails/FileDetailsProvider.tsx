import React, { createContext } from "react";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";

export interface FileDetailsContext {
    close: () => void;
    own: boolean;
    scope?: string;
}

export const FileDetailsContext = createContext<FileDetailsContext | undefined>(undefined);

interface FileDetailsProviderProps {
    hideFileDetails: () => void;
    children: React.ReactNode;
}

export const FileDetailsProvider = ({ hideFileDetails, children }: FileDetailsProviderProps) => {
    const view = useFileManagerView();
    const value: FileDetailsContext = { close: hideFileDetails, scope: view.scope, own: view.own };

    return <FileDetailsContext.Provider value={value}>{children}</FileDetailsContext.Provider>;
};
