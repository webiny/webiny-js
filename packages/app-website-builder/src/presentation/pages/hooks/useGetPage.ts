import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { GetPageFeature } from "~/features/pages/getPage/index.js";
import type { GetPageParams } from "~/features/pages/getPage/index.js";

export const useGetPage = () => {
    const { useCase } = useFeature(GetPageFeature);

    const getPage = useCallback(
        async (params: GetPageParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        getPage
    };
};
