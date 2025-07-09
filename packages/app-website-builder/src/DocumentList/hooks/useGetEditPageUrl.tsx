import { useCallback } from "react";
import { useNavigateFolder } from "@webiny/app-aco";
import type { DocumentDto } from "~/DocumentList/presenters/index.js";
import { PAGE_EDITOR_ROUTE } from "~/constants.js";

export const useGetEditPageUrl = () => {
    const { currentFolderId } = useNavigateFolder();

    const getEditPageUrl = useCallback(
        (page: DocumentDto) => {
            const folderPath = currentFolderId
                ? `&folderId=${encodeURIComponent(currentFolderId)}`
                : "";
            const idPath = encodeURIComponent(page.id);

            return `${PAGE_EDITOR_ROUTE}?id=${idPath}${folderPath}`;
        },
        [currentFolderId]
    );

    return {
        getEditPageUrl
    };
};
