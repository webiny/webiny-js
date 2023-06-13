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

export const useFileDetails = () => {
    const context = React.useContext(FileDetailsContext);
    if (!context) {
        throw Error(
            `FileDetailsContext is missing in the component tree. Are you using "useFileDetails()" hook in the right place?`
        );
    }

    return context;
};
