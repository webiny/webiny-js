import { useNavigateFolder } from "@webiny/app-aco";
import { useRouter } from "@webiny/react-router";
import { useCallback, useMemo } from "react";
import { PAGE_BUILDER_EDITOR_LINK, PAGE_BUILDER_LIST_LINK } from "~/admin/constants";

interface UseNavigatePageResponse {
    navigateToLatestFolder: () => void;
    navigateToListHome: () => void;
    navigateToPageEditor: (id: string) => void;
}

export const useNavigatePage = () => {
    let navigateFolder: ReturnType<typeof useNavigateFolder> | undefined;
    try {
        navigateFolder = useNavigateFolder();
    } catch {}
    const { history, params } = useRouter();
    const folderId = params["folderId"];
    const getFolderUrl = useCallback(() => {
        return params["folderId"] ? `?folderId=${params["folderId"]}` : "";
    }, [folderId]);

    return useMemo<UseNavigatePageResponse>(() => {
        const navigateToPageEditor = (id: string) => {
            return history.push(`${PAGE_BUILDER_EDITOR_LINK}/${encodeURIComponent(id)}`);
        };
        if (navigateFolder) {
            return {
                navigateToLatestFolder: navigateFolder.navigateToLatestFolder,
                navigateToListHome: navigateFolder.navigateToListHome,
                navigateToPageEditor
            };
        }
        return {
            navigateToLatestFolder: () => {
                return history.push(`${PAGE_BUILDER_LIST_LINK}${getFolderUrl()}`);
            },
            navigateToListHome: () => {
                return history.push(PAGE_BUILDER_LIST_LINK);
            },
            navigateToPageEditor
        };
    }, [navigateFolder, params]);
};
