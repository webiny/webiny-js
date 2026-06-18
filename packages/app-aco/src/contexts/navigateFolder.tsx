import React, { useCallback, useEffect } from "react";
import { ROOT_FOLDER } from "~/constants";
import { useLocalStorage } from "@webiny/app";

export interface NavigateFolderContext {
    currentFolderId: string;
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

export const NavigateFolderProvider = ({
    folderId: currentFolderId,
    children,
    createStorageKey,
    ...props
}: NavigateFolderProviderProps) => {
    const { localStorage } = useLocalStorage();
    /**
     * Helper function to set the current folderId to local storage:
     * we export this function to call it programmatically when we need it and
     * persist the value on view switch.
     */
    const setFolderToStorage = useCallback(
        (newFolderId?: string): void => {
            localStorage.set(createStorageKey(), newFolderId);
        },
        [createStorageKey]
    );

    /**
     * Helper function to get the current folderId to local storage.
     * NOTE: with 5.37.0 we moved from "ROOT" to "root" as home folderId,
     * we need to return the lowercase value.
     */
    const getFolderFromStorage = useCallback((): string | undefined => {
        const folderId = localStorage.get(createStorageKey()) as string | undefined;
        return folderId?.toLowerCase();
    }, [createStorageKey]);

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
        const storageFolderId = getFolderFromStorage();
        props.navigateToLatestFolder(currentFolderId || storageFolderId || ROOT_FOLDER);
    }, [currentFolderId]);

    const navigateToFolder = useCallback(
        (folderId?: string) => {
            const targetFolderId = folderId || ROOT_FOLDER;
            if (targetFolderId === currentFolderId) {
                return;
            }
            setFolderToStorage(folderId);
            props.navigateToFolder(targetFolderId);
        },
        [currentFolderId]
    );

    const navigateToListHome = () => {
        localStorage.remove(createStorageKey());
        props.navigateToListHome();
    };

    const context: NavigateFolderContext = {
        currentFolderId: currentFolderId || getFolderFromStorage() || ROOT_FOLDER,
        setFolderToStorage,
        navigateToListHome,
        navigateToFolder,
        navigateToLatestFolder
    };

    return (
        <NavigateFolderContext.Provider value={context}>{children}</NavigateFolderContext.Provider>
    );
};
