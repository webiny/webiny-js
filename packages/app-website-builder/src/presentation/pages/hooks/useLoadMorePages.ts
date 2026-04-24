import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { LoadPagesFeature } from "~/features/pages/loadPages/index.js";

export const useLoadMorePages = () => {
    const { loadMorePages: useCase } = useFeature(LoadPagesFeature);

    const loadMorePages = useCallback(() => {
        return useCase.execute();
    }, [useCase]);

    return { loadMorePages };
};
