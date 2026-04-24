import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { LoadPagesFeature } from "~/features/pages/loadPages/index.js";
import type { LoadPagesUseCaseParams } from "~/features/pages/loadPages/index.js";

export const useLoadPages = () => {
    const { loadPages: useCase } = useFeature(LoadPagesFeature);

    const loadPages = useCallback(
        async (params: LoadPagesUseCaseParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return { loadPages };
};
