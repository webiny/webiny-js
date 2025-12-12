import { useCallback } from "react";
import { useGetDescendantFolders } from "@webiny/app-aco";
import { FilterPages } from "~/features/pages/loadPages/FilterPages.js";
import { useListPagesGateway } from "~/features/pages/loadPages/useListPagesGateway.js";

export const useFilterPages = () => {
    const gateway = useListPagesGateway(["properties", "metadata"]);
    const { getDescendantFolders } = useGetDescendantFolders();

    const filterPages = useCallback(
        (filters: Record<string, any>, folderId: string) => {
            const instance = FilterPages.getInstance(gateway);
            const folders = getDescendantFolders(folderId);
            return instance.execute({
                filters,
                folderIds: folders.map(f => f.id)
            });
        },
        [gateway]
    );

    return {
        filterPages
    };
};
