import { useCallback } from "react";
import { useNavigateFolder } from "@webiny/app-aco";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

export const useEditPageUrl = () => {
    const { goToRoute, getLink } = useRouter();
    const { currentFolderId } = useNavigateFolder();

    const getEditPageUrl = useCallback(
        (id: string) => {
            return getLink(Routes.Pages.Editor, { id, folderId: currentFolderId });
        },
        [currentFolderId]
    );

    const goToPageEditor = (id: string) => {
        goToRoute(Routes.Pages.Editor, { id, folderId: currentFolderId });
    };

    return {
        getEditPageUrl,
        goToPageEditor
    };
};
