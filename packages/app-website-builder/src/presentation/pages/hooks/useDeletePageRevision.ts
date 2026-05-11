import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { DeletePageRevisionFeature } from "~/features/pages/deletePageRevision/index.js";
import type { DeletePageRevisionParams } from "~/features/pages/deletePageRevision/index.js";

export const useDeletePageRevision = () => {
    const { useCase } = useFeature(DeletePageRevisionFeature);

    const deletePageRevision = useCallback(
        async (params: DeletePageRevisionParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        deletePageRevision
    };
};
