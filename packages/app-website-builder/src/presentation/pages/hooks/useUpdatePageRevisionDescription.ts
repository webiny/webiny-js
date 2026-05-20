import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { UpdatePageRevisionDescriptionFeature } from "~/features/pages/updatePageRevisionDescription/index.js";
import type { UpdatePageRevisionDescriptionParams } from "~/features/pages/updatePageRevisionDescription/index.js";

export const useUpdatePageRevisionDescription = () => {
    const { useCase } = useFeature(UpdatePageRevisionDescriptionFeature);

    const updatePageRevisionDescription = useCallback(
        async (params: UpdatePageRevisionDescriptionParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        updatePageRevisionDescription
    };
};
