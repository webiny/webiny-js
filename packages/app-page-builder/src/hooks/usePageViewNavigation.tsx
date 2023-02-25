import { useState, useEffect } from "react";
import { useRouter } from "@webiny/react-router";
import store from "store";

const PAGE_BUILDER_LIST_LINK = "/page-builder/pages";
const LOCAL_STORAGE_LATEST_VISITED_FOLDER = "webiny_pb_page_latest_visited_folder";

export const usePageViewNavigation = () => {
    const [currentFolderId, setCurrentFolderId] = useState<string>();
    const { history, location } = useRouter();

    const query = new URLSearchParams(location.search);
    const folderId = query.get("folderId") || undefined;

    useEffect(() => {
        setCurrentFolderId(folderId);
    }, [folderId]);

    /**
     * Helper function to set the current folderId to local storage:
     * we export this function to call it programmatically when we need it and
     * persist the value on view switch.
     */
    const setFolderIdToStorage = (folderId?: string): void => {
        store.set(LOCAL_STORAGE_LATEST_VISITED_FOLDER, folderId);
    };

    /**
     * Navigate to page-builder home list.
     */
    const navigateToPageHome = () => {
        return history.push(PAGE_BUILDER_LIST_LINK);
    };

    /**
     * Navigate to a specific folder.
     */
    const navigateToFolder = (folderId: string): void => {
        const query = new URLSearchParams(location.search);
        query.set("folderId", folderId);

        return history.push({ search: query.toString() });
    };

    /**
     * Navigate back to page-builder list, considering the latest visited folder.
     */
    const navigateToLatestFolder = () => {
        const folderId = store.get(LOCAL_STORAGE_LATEST_VISITED_FOLDER);
        const searchParams = new URLSearchParams({ ...(folderId && { folderId }) }).toString();

        return history.push({
            pathname: PAGE_BUILDER_LIST_LINK,
            search: searchParams
        });
    };

    return {
        currentFolderId,
        setFolderIdToStorage,
        navigateToPageHome,
        navigateToFolder,
        navigateToLatestFolder
    };
};
