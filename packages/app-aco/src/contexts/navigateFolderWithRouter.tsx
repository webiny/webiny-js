import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "@webiny/react-router";
import { NavigateFolderProvider } from "~/contexts/navigateFolder";

export interface NavigateFolderProviderProps {
    children: React.ReactNode;
    folderIdQueryString?: string;
    createStorageKey: () => string;
    createListLink?: () => string;
}

export const NavigateFolderWithRouterProvider: React.VFC<NavigateFolderProviderProps> = ({
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

    const createListLink = useCallback(() => {
        if (!initialCreateListLink) {
            return undefined;
        }
        return initialCreateListLink();
    }, [initialCreateListLink]);

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
    const navigateToLatestFolder = useCallback(
        folderId => {
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
        },
        [createListLink, createStorageKey, folderIdQueryString, folderId]
    );

    return (
        <NavigateFolderProvider
            folderId={currentFolderId}
            createStorageKey={createStorageKey}
            navigateToFolder={navigateToFolder}
            navigateToLatestFolder={navigateToLatestFolder}
            navigateToListHome={navigateToListHome}
        >
            {children}
        </NavigateFolderProvider>
    );
};
