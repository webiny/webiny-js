import React, { createContext } from "react";

export interface FileDetailsContext {
    close: () => void;
    own: boolean;
    scope?: string;
}

export const FileDetailsContext = createContext<FileDetailsContext | undefined>(undefined);

interface FileDetailsProviderProps {
    scope?: string;
    own?: boolean;
    hideFileDetails: () => void;
    children: React.ReactNode;
}

export const FileDetailsProvider = ({
    hideFileDetails,
    scope,
    own,
    children
}: FileDetailsProviderProps) => {
    const value: FileDetailsContext = { close: hideFileDetails, scope, own: Boolean(own) };

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
