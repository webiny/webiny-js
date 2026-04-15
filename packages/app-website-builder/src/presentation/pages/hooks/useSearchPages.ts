import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { useGetDescendantFolders } from "@webiny/app-aco";
import { LoadPagesFeature } from "~/features/pages/loadPages/index.js";

export const useSearchPages = () => {
    const { searchPages: useCase } = useFeature(LoadPagesFeature);
    const { getDescendantFolders } = useGetDescendantFolders();

    const searchPages = useCallback(
        (query: string, folderId: string) => {
            const folders = getDescendantFolders(folderId);
            return useCase.execute({
                query,
                folderIds: folders.map(f => f.id)
            });
        },
        [useCase]
    );

    return { searchPages };
};
