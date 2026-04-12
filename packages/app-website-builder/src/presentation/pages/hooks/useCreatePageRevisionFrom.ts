import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { CreatePageRevisionFromFeature } from "~/features/pages/createPageRevisionFrom/index.js";
import type { CreatePageRevisionFromParams } from "~/features/pages/createPageRevisionFrom/index.js";

export const useCreatePageRevisionFrom = () => {
    const { useCase } = useFeature(CreatePageRevisionFromFeature);

    const createPageRevisionFrom = useCallback(
        async (params: CreatePageRevisionFromParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        createPageRevisionFrom
    };
};
