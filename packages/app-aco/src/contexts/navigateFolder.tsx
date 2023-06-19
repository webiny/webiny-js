import React, { useCallback, useEffect } from "react";
import store from "store";

export interface NavigateFolderContext {
    currentFolderId?: string;
    setFolderToStorage: (folderId?: string) => void;
    navigateToListHome: () => void;
    navigateToFolder: (folder?: string) => void;
    navigateToLatestFolder: () => void;
}

export const NavigateFolderContext = React.createContext<NavigateFolderContext | undefined>(
    undefined
);

export interface NavigateFolderProviderProps {
    folderId: string | undefined;
    children: React.ReactNode;
    navigateToListHome: () => void;
    navigateToFolder: (folderId: string) => void;
    navigateToLatestFolder: (folderId: string) => void;
    createStorageKey: () => string;
}

export const NavigateFolderProvider: React.VFC<NavigateFolderProviderProps> = ({
    folderId,
    children,
    createStorageKey,
    ...props
}) => {
    /**
     * Helper function to set the current folderId to local storage:
     * we export this function to call it programmatically when we need it and
     * persist the value on view switch.
     */
    const setFolderToStorage = useCallback(
        (newFolderId?: string): void => {
            store.set(createStorageKey(), newFolderId);
        },
        [createStorageKey]
    );

    useEffect(() => {
        setTimeout(() => {
            // Defer navigation to next tick.
            navigateToLatestFolder();
        });
    }, []);

    /**
     * Navigate to the latest folder, considering the latest visited folder.
     */
    const navigateToLatestFolder = useCallback(() => {
        const folderId = store.get(createStorageKey());
        props.navigateToLatestFolder(folderId || "ROOT");
    }, [createStorageKey, folderId]);

    const navigateToFolder = useCallback(
        (folderId?: string) => {
            setFolderToStorage(folderId);
            props.navigateToFolder(folderId || "ROOT");
        },
        [folderId]
    );

    const navigateToListHome = () => {
        store.remove(createStorageKey());
        props.navigateToListHome();
    };

    const context: NavigateFolderContext = {
        currentFolderId: folderId || store.get(createStorageKey()),
        setFolderToStorage,
        navigateToListHome,
        navigateToFolder,
        navigateToLatestFolder
    };

    return (
        <NavigateFolderContext.Provider value={context}>{children}</NavigateFolderContext.Provider>
    );
};