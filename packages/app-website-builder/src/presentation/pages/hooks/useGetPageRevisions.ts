import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { GetPageRevisionsFeature } from "~/features/pages/getPageRevisions/index.js";
import type { GetPageRevisionsParams } from "~/features/pages/getPageRevisions/index.js";

export const useGetPageRevisions = () => {
    const { useCase, loadingRepository } = useFeature(GetPageRevisionsFeature);

    const getPageRevisions = useCallback(
        async (params: GetPageRevisionsParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        getPageRevisions,
        loading: loadingRepository.isLoading("WbPageRevisions")
    };
};
