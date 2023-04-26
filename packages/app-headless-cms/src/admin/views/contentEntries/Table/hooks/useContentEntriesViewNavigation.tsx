import store from "store";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@webiny/react-router";
import { CmsModel } from "~/types";
import { useModel } from "~/admin/components/ModelProvider";

const createCmsEntriesLink = (model: CmsModel) => {
    return `/cms/content-entries/${model.modelId}`;
};
const LOCAL_STORAGE_LATEST_VISITED_FOLDER = "webiny_cms_entries_latest_visited_folder";

export const useContentEntriesViewNavigation = () => {
    const { history } = useRouter();
    const { model } = useModel();
    const query = new URLSearchParams(location.search);
    const folderId = query.get("folderId") || undefined;
    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(folderId);

    useEffect(() => {
        setCurrentFolderId(folderId);
        setFolderIdToStorage(folderId);
    }, [folderId]);

    /**
     * Helper function to set the current folderId to local storage:
     * we export this function to call it programmatically when we need it and
     * persist the value on view switch.
     */
    const setFolderIdToStorage = useCallback(
        (folderId?: string): void => {
            store.set(LOCAL_STORAGE_LATEST_VISITED_FOLDER, folderId);
        },
        [store]
    );

    /**
     * Navigate to cms entries home list.
     */
    const navigateToModelHome = useCallback(() => {
        return history.push(createCmsEntriesLink(model));
    }, [history]);

    /**
     * Navigate to a specific folder.
     */
    const navigateToFolder = useCallback(
        (folderId: string): void => {
            const query = new URLSearchParams(location.search);
            query.set("folderId", folderId);

            return history.push({ search: query.toString() });
        },
        [history, store]
    );

    /**
     * Navigate back to cms entries list, considering the latest visited folder.
     */
    const navigateToLatestFolder = useCallback(() => {
        const folderId = store.get(LOCAL_STORAGE_LATEST_VISITED_FOLDER);
        const searchParams = new URLSearchParams({ ...(folderId && { folderId }) }).toString();

        return history.push({
            pathname: createCmsEntriesLink(model),
            search: searchParams
        });
    }, [history, store]);

    return {
        currentFolderId,
        setFolderIdToStorage,
        navigateToModelHome,
        navigateToFolder,
        navigateToLatestFolder
    };
};
