import type { WbPagesStorageOperations } from "~/page/page.types";
import { ListPages } from "./ListPages";

interface ListPagesUseCasesParams {
    listOperation: WbPagesStorageOperations["list"];
}

export const getListPagesUseCase = (params: ListPagesUseCasesParams) => {
    const listPagesUseCase = new ListPages(params.listOperation);

    return {
        listPagesUseCase
    };
};
