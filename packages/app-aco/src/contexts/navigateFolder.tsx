import React, { useCallback, useEffect } from "react";
import store from "store";
import { ROOT_FOLDER } from "~/constants.js";

export interface NavigateFolderContext {
    currentFolderId: string;
    isRootFolder: boolean;
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
    navigateToFolder: (folderId: string) => void;
    createStorageKey: () => string;
}

export const NavigateFolderProvider = ({
    folderId: currentFolderId,
    children,
    createStorageKey,
    ...props
}: NavigateFolderProviderProps) => {
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

    const getFolderFromStorage = useCallback((): string | undefined => {
        const folderId = store.get(createStorageKey()) as string | undefined;
        return folderId?.toLowerCase();
    }, [createStorageKey]);

    useEffect(() => {
        setTimeout(() => {
            // Defer navigation to next tick.
            navigateToLatestFolder();
        });
    }, []);

    /**
     * Navigate to the latest visited folder.
     */
    const navigateToLatestFolder = useCallback(() => {
        const storageFolderId = getFolderFromStorage();
        if (!currentFolderId) {
            props.navigateToFolder(storageFolderId || ROOT_FOLDER);
        }
    }, [currentFolderId]);

    const navigateToFolder = useCallback(
        (folderId?: string) => {
            setFolderToStorage(folderId);
            props.navigateToFolder(folderId || ROOT_FOLDER);
        },
        [currentFolderId]
    );

    const navigateToListHome = () => {
        store.remove(createStorageKey());
        props.navigateToFolder(ROOT_FOLDER);
    };

    const finalFolderId = currentFolderId || getFolderFromStorage() || ROOT_FOLDER;

    const context: NavigateFolderContext = {
        currentFolderId: finalFolderId,
        isRootFolder: finalFolderId === ROOT_FOLDER,
        setFolderToStorage,
        navigateToListHome,
        navigateToFolder,
        navigateToLatestFolder
    };

    return (
        <NavigateFolderContext.Provider value={context}>{children}</NavigateFolderContext.Provider>
    );
};
