import { GetRevisionById } from "./GetRevisionById";
import { GetRevisionByIdNotDeleted } from "./GetRevisionByIdNotDeleted";
import type { CmsEntryStorageOperations } from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

interface GetRevisionByIdUseCasesParams {
    operation: CmsEntryStorageOperations["getRevisionById"];
    transform: ITransformEntryCallable;
}

export const getRevisionByIdUseCases = (params: GetRevisionByIdUseCasesParams) => {
    const getRevisionById = new GetRevisionById(params.operation, params.transform);
    const getRevisionByIdNotDeleted = new GetRevisionByIdNotDeleted(getRevisionById);

    return {
        getRevisionByIdUseCase: getRevisionByIdNotDeleted
    };
};
