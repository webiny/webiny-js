import React, { useCallback, useState } from "react";
import { NavigateFolderProvider as AbstractNavigateFolderProvider } from "@webiny/app-aco/contexts/navigateFolder";
import { LOCAL_STORAGE_LATEST_VISITED_FOLDER } from "~/constants";

const createStorageKey = () => {
    return LOCAL_STORAGE_LATEST_VISITED_FOLDER;
};

export const NavigateFolderProvider = ({ children }: { children: React.ReactNode }) => {
    const [folderId, setFolderId] = useState<string | undefined>(undefined);

    const navigateToFolder = useCallback((folderId: string) => {
        setFolderId(folderId);
    }, []);

    const navigateToListHome = useCallback(() => {
        setFolderId(undefined);
    }, []);

    return (
        <AbstractNavigateFolderProvider
            folderId={folderId}
            createStorageKey={createStorageKey}
            navigateToFolder={navigateToFolder}
            navigateToLatestFolder={navigateToFolder}
            navigateToListHome={navigateToListHome}
        >
            {children}
        </AbstractNavigateFolderProvider>
    );
};
