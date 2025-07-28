import { useCallback } from "react";
import { useNavigateFolder } from "@webiny/app-aco";
import { PAGE_EDITOR_ROUTE } from "~/constants.js";

export const useGetEditPageUrl = () => {
    const { currentFolderId } = useNavigateFolder();

    const getEditPageUrl = useCallback(
        (id: string) => {
            const queryParams = [];
            if (currentFolderId) {
                {
                    queryParams.push(`folderId=${encodeURIComponent(currentFolderId)}`);
                }
            }

            const idPath = encodeURIComponent(id);

            return `${PAGE_EDITOR_ROUTE}/${idPath}?${queryParams.join("&")}`;
        },
        [currentFolderId]
    );

    return {
        getEditPageUrl
    };
};
