import { GetLatestRevisionByEntryId } from "./GetLatestRevisionByEntryId";
import { GetLatestRevisionByEntryIdDeleted } from "./GetLatestRevisionByEntryIdDeleted";
import { GetLatestRevisionByEntryIdNotDeleted } from "./GetLatestRevisionByEntryIdNotDeleted";
import type { CmsEntryStorageOperations } from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

interface GetLatestRevisionByEntryIdUseCasesParams {
    operation: CmsEntryStorageOperations["getLatestRevisionByEntryId"];
    transform: ITransformEntryCallable;
}

export const getLatestRevisionByEntryIdUseCases = (
    params: GetLatestRevisionByEntryIdUseCasesParams
) => {
    const getLatestRevisionByEntryId = new GetLatestRevisionByEntryId(
        params.operation,
        params.transform
    );
    const getLatestRevisionByEntryIdNotDeleted = new GetLatestRevisionByEntryIdNotDeleted(
        getLatestRevisionByEntryId
    );
    const getLatestRevisionByEntryIdDeleted = new GetLatestRevisionByEntryIdDeleted(
        getLatestRevisionByEntryId
    );

    return {
        getLatestRevisionByEntryIdUseCase: getLatestRevisionByEntryIdNotDeleted,
        getLatestRevisionByEntryIdWithDeletedUseCase: getLatestRevisionByEntryId,
        getLatestRevisionByEntryIdDeletedUseCase: getLatestRevisionByEntryIdDeleted
    };
};
