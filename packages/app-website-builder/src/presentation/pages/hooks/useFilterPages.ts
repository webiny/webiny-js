import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { useGetDescendantFolders } from "@webiny/app-aco";
import { LoadPagesFeature } from "~/features/pages/loadPages/index.js";

export const useFilterPages = () => {
    const { filterPages: useCase } = useFeature(LoadPagesFeature);
    const { getDescendantFolders } = useGetDescendantFolders();

    const filterPages = useCallback(
        (filters: Record<string, any>, folderId: string) => {
            const folders = getDescendantFolders(folderId);
            return useCase.execute({
                filters,
                folderIds: folders.map(f => f.id)
            });
        },
        [useCase]
    );

    return { filterPages };
};
