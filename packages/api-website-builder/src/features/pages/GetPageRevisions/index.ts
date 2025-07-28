import { GetPageRevisions } from "./GetPageRevisions";
import type { WbPagesStorageOperations } from "~/context/pages/pages.types";

interface GetPageRevisionsUseCasesParams {
    getRevisions: WbPagesStorageOperations["getRevisions"];
}

export const getGetPageRevisionsUseCase = (params: GetPageRevisionsUseCasesParams) => {
    const getPageRevisionsUseCase = new GetPageRevisions(params.getRevisions);

    return {
        getPageRevisionsUseCase
    };
};
