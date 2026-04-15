import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { DeletePageFeature } from "~/features/pages/deletePage/index.js";
import type { DeletePageParams } from "~/features/pages/deletePage/index.js";

export const useDeletePage = () => {
    const { useCase } = useFeature(DeletePageFeature);

    const deletePage = useCallback(
        async (params: DeletePageParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        deletePage
    };
};
