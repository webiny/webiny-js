import type { WbRedirectsStorageOperations } from "~/context/redirects/redirects.types";
import { ListRedirects } from "./ListRedirects";

interface ListRedirectsUseCasesParams {
    listOperation: WbRedirectsStorageOperations["list"];
}

export const getListRedirectsUseCase = (params: ListRedirectsUseCasesParams) => {
    const listRedirectsUseCase = new ListRedirects(params.listOperation);

    return {
        listRedirectsUseCase
    };
};
