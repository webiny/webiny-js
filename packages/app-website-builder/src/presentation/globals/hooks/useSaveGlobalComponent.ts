import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { SaveGlobalComponentFeature } from "~/features/globals/saveGlobalComponent/index.js";
import type { SaveGlobalComponentParams } from "~/features/globals/saveGlobalComponent/index.js";

export const useSaveGlobalComponent = () => {
    const { useCase } = useFeature(SaveGlobalComponentFeature);

    const saveGlobalComponent = useCallback(
        async (params: SaveGlobalComponentParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        saveGlobalComponent
    };
};
