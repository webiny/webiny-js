import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { TranslatePageFeature } from "~/features/pages/translatePage/index.js";
import type { TranslatePageParams } from "~/features/pages/translatePage/index.js";

export const useTranslatePage = () => {
    const { useCase } = useFeature(TranslatePageFeature);

    const translatePage = useCallback(
        async (params: TranslatePageParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        translatePage
    };
};
