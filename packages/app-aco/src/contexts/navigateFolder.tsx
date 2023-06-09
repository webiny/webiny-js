import React, { useCallback, useEffect, useState } from "react";
import store from "store";
import { useRouter } from "@webiny/react-router";

interface NavigateFolderContext {
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
    children: React.ReactNode;
    folderIdQueryString?: string;
    createStorageKey: () => string;
    createListLink?: () => string;
}

export const NavigateFolderProvider: React.VFC<NavigateFolderProviderProps> = ({
    children,
    folderIdQueryString = "folderId",
    createStorageKey,
    createListLink: initialCreateListLink
}) => {
    const { history, search, location } = useRouter();
    const [query] = search;
    const folderId = query.get(folderIdQueryString) || undefined;
    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(folderId);

    useEffect(() => {
        setCurrentFolderId(folderId);
    }, [folderId]);

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

    const createListLink = useCallback(() => {
        if (!initialCreateListLink) {
            return undefined;
        }
        return initialCreateListLink();
    }, [initialCreateListLink]);

    useEffect(() => {
        setFolderToStorage(currentFolderId);
    }, [currentFolderId]);

    /**
     * Navigate to page-builder home list.
     */
    const navigateToListHome = useCallback(() => {
        const url = createListLink();
        if (url) {
            return history.push(url);
        }

        return navigateToFolder(undefined);
    }, [createListLink, folderId]);

    /**
     * Navigate to a specific folder.
     */
    const navigateToFolder = useCallback(
        (newFolderId?: string): void => {
            const query = new URLSearchParams(location.search);
            query.delete("new");
            query.delete("id");
            query.delete("entryId");
            query.set(folderIdQueryString, newFolderId || "");
            return history.push({
                search: query.toString()
            });
        },
        [location, folderIdQueryString, folderId]
    );

    /**
     * Navigate back to page-builder list, considering the latest visited folder.
     */
    const navigateToLatestFolder = useCallback(() => {
        const folderId = store.get(createStorageKey());
        if (folderId) {
            const search = new URLSearchParams({
                [folderIdQueryString]: folderId
            });
            return history.push({
                pathname: createListLink(),
                search: search.toString()
            });
        }

        return history.push({
            pathname: createListLink(),
            search: new URLSearchParams({}).toString()
        });
    }, [createListLink, createStorageKey, folderIdQueryString, folderId]);

    const context: NavigateFolderContext = {
        currentFolderId,
        setFolderToStorage,
        navigateToListHome,
        navigateToFolder,
        navigateToLatestFolder
    };

    return (
        <NavigateFolderContext.Provider value={context}>{children}</NavigateFolderContext.Provider>
    );
};
