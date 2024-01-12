import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "@webiny/react-router";
import { NavigateFolderProvider } from "~/contexts/navigateFolder";
import { ROOT_FOLDER } from "~/constants";

export interface NavigateFolderProviderProps {
    children: React.ReactNode;
    folderIdQueryString?: string;
    createStorageKey: () => string;
    createListLink?: () => string;
}

export const NavigateFolderWithRouterProvider = ({
    children,
    folderIdQueryString = "folderId",
    createStorageKey,
    createListLink: initialCreateListLink
}: NavigateFolderProviderProps) => {
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
     * Navigate to  home list.
     */
    const navigateToListHome = useCallback(() => {
        const url = createListLink();
        if (url) {
            return history.push(url);
        }

        return navigateToFolder(ROOT_FOLDER);
    }, [createListLink]);

    /**
     * Navigate to a specific folder.
     */
    const navigateToFolder = useCallback(
        (newFolderId: string): void => {
            const query = new URLSearchParams(location.search);
            query.delete("new");
            query.delete("id");
            query.delete("entryId");
            query.delete("search");
            query.set(folderIdQueryString, newFolderId);
            return history.push({
                search: query.toString()
            });
        },
        [location, folderIdQueryString]
    );

    /**
     * Navigate back to list, considering the latest visited folder.
     */
    const navigateToLatestFolder = useCallback(
        (folderId: string) => {
            /**
             * We need to check if the stored folderId is the same as the current one, in this case we skip the navigation.
             */
            if (folderId === currentFolderId) {
                return;
            }

            const query = new URLSearchParams(location.search);
            query.set(folderIdQueryString, folderId);

            return history.push({
                pathname: createListLink(),
                search: query.toString()
            });
        },
        [createListLink, folderIdQueryString]
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
