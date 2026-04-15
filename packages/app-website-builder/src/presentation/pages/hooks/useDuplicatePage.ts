import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { DuplicatePageFeature } from "~/features/pages/duplicatePage/index.js";
import type { DuplicatePageParams } from "~/features/pages/duplicatePage/index.js";

export const useDuplicatePage = () => {
    const { useCase } = useFeature(DuplicatePageFeature);

    const duplicatePage = useCallback(
        async (params: DuplicatePageParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        duplicatePage
    };
};
