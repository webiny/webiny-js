import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { UnpublishPageFeature } from "~/features/pages/unpublishPage/index.js";
import type { UnpublishPageParams } from "~/features/pages/unpublishPage/index.js";

export const useUnpublishPage = () => {
    const { useCase } = useFeature(UnpublishPageFeature);

    const unpublishPage = useCallback(
        async (params: UnpublishPageParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        unpublishPage
    };
};
