import { useCallback } from "react";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";
import { usePageListPresenter } from "../PageListPresenterProvider.js";

export const useEditPageUrl = () => {
    const { goToRoute, getLink } = useRouter();
    const { folders } = usePageListPresenter();
    const currentFolderId = folders.vm.currentFolderId ?? undefined;

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
