import React, { createContext } from "react";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import type { FileItem } from "~/types.js";

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
    const { vm } = useFileManagerPresenter();

    const value: FileDetailsContext = {
        close: hideFileDetails,
        scope: vm.scope,
        own: false,
        setFile: onSetFile
    };

    return <FileDetailsContext.Provider value={value}>{children}</FileDetailsContext.Provider>;
};
