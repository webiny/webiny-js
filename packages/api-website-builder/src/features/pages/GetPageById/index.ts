import { GetPageById } from "./GetPageById";
import type { WbPagesStorageOperations } from "~/context/pages/pages.types";

interface GetPageByIdUseCasesParams {
    getOperation: WbPagesStorageOperations["getById"];
}

export const getGetPageByIdUseCase = (params: GetPageByIdUseCasesParams) => {
    const getPageByIdUseCase = new GetPageById(params.getOperation);

    return {
        getPageByIdUseCase
    };
};
