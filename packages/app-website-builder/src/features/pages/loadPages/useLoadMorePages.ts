import { useCallback } from "react";
import { LoadMorePages } from "~/features/pages/loadPages/LoadMorePages.js";
import { useListPagesGateway } from "./useListPagesGateway.js";

export const useLoadMorePages = () => {
    const gateway = useListPagesGateway(["properties", "metadata"]);

    const loadMorePages = useCallback(() => {
        const instance = LoadMorePages.getInstance(gateway);
        return instance.execute();
    }, [gateway]);

    return {
        loadMorePages
    };
};
