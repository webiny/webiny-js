import { GetRedirectById } from "./GetRedirectById";
import type { WbRedirectsStorageOperations } from "~/context/redirects/redirects.types";

interface GetRedirectByIdUseCasesParams {
    getOperation: WbRedirectsStorageOperations["getById"];
}

export const getGetRedirectByIdUseCase = (params: GetRedirectByIdUseCasesParams) => {
    const getRedirectByIdUseCase = new GetRedirectById(params.getOperation);

    return {
        getRedirectByIdUseCase
    };
};
