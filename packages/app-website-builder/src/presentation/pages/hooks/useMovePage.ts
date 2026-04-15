import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { MovePageFeature } from "~/features/pages/movePage/index.js";
import type { MovePageParams } from "~/features/pages/movePage/index.js";

export const useMovePage = () => {
    const { useCase } = useFeature(MovePageFeature);

    const movePage = useCallback(
        async (params: MovePageParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        movePage
    };
};
