import { GetPage } from "./GetPage";
import type { WbPagesStorageOperations } from "~/page/page.types";

interface GetPageUseCasesParams {
    getOperation: WbPagesStorageOperations["get"];
}

export const getGetPageUseCase = (params: GetPageUseCasesParams) => {
    const getPageUseCase = new GetPage(params.getOperation);

    return {
        getPageUseCase
    };
};
