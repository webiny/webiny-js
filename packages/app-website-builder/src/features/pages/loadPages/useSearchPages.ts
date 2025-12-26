import { useCallback } from "react";
import { SearchPages } from "~/features/pages/loadPages/SearchPages.js";
import { useGetDescendantFolders } from "@webiny/app-aco";
import { useListPagesGateway } from "~/features/pages/loadPages/useListPagesGateway.js";

export const useSearchPages = () => {
    const gateway = useListPagesGateway(["properties", "metadata"]);
    const { getDescendantFolders } = useGetDescendantFolders();

    const searchPages = useCallback(
        (query: string, folderId: string) => {
            const instance = SearchPages.getInstance(gateway);
            const folders = getDescendantFolders(folderId);
            return instance.execute({
                query,
                folderIds: folders.map(f => f.id)
            });
        },
        [gateway]
    );

    return {
        searchPages
    };
};
