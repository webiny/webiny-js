import { useNavigateFolder } from "@webiny/app-aco";
import { useRouter } from "@webiny/react-router";
import { useMemo } from "react";
import { PAGE_BUILDER_EDITOR_LINK, PAGE_BUILDER_LIST_LINK } from "~/admin/constants";

interface UseNavigatePageResponse {
    navigateToLatestFolder: () => void;
    navigateToListHome: () => void;
    getPageEditorUrl: (id: string) => string;
    navigateToPageEditor: (id: string) => void;
}

export const useNavigatePage = () => {
    let navigateFolder: ReturnType<typeof useNavigateFolder> | undefined;
    try {
        navigateFolder = useNavigateFolder();
    } catch {}
    const { history, params } = useRouter();
    const folderId = params["folderId"];
    const folderUrl = useMemo(() => {
        return params["folderId"] ? `?folderId=${params["folderId"]}` : "";
    }, [folderId]);

    return useMemo<UseNavigatePageResponse>(() => {
        const getPageEditorUrl = (id: string) => {
            return `${PAGE_BUILDER_EDITOR_LINK}/${encodeURIComponent(id)}${folderUrl}`;
        };
        const navigateToPageEditor = (id: string) => {
            return history.push(getPageEditorUrl(id));
        };
        if (navigateFolder) {
            return {
                navigateToLatestFolder: navigateFolder.navigateToLatestFolder,
                navigateToListHome: navigateFolder.navigateToListHome,
                getPageEditorUrl,
                navigateToPageEditor
            };
        }
        return {
            navigateToLatestFolder: () => {
                return history.push(`${PAGE_BUILDER_LIST_LINK}${folderUrl}`);
            },
            navigateToListHome: () => {
                return history.push(PAGE_BUILDER_LIST_LINK);
            },
            getPageEditorUrl,
            navigateToPageEditor
        };
    }, [navigateFolder, params]);
};
