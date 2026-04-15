import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { CreatePageFeature } from "~/features/pages/createPage/index.js";
import type { CreatePageParams } from "~/features/pages/createPage/index.js";

export const useCreatePage = () => {
    const { useCase } = useFeature(CreatePageFeature);

    const createPage = useCallback(
        async (params: CreatePageParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        createPage
    };
};
