import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { PublishPageFeature } from "~/features/pages/publishPage/index.js";
import type { PublishPageParams } from "~/features/pages/publishPage/index.js";

export const usePublishPage = () => {
    const { useCase } = useFeature(PublishPageFeature);

    const publishPage = useCallback(
        async (params: PublishPageParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        publishPage
    };
};
