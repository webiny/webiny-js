import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { SelectPagesFeature } from "~/features/pages/selectPages/index.js";

export const useSelectPages = <T = any>() => {
    const { useCase } = useFeature(SelectPagesFeature);

    const selectPages = useCallback(
        async (pages: T[]) => {
            return useCase.execute(pages);
        },
        [useCase]
    );

    return {
        selectPages
    };
};
