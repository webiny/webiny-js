import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { UpdatePageFeature } from "~/features/pages/updatePage/index.js";
import type { UpdatePageParams } from "~/features/pages/updatePage/index.js";

export const useUpdatePage = () => {
    const { useCase } = useFeature(UpdatePageFeature);

    const updatePage = useCallback(
        async (params: UpdatePageParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        updatePage
    };
};
