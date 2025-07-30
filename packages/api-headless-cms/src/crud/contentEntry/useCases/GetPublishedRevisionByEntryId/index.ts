import { GetPublishedRevisionByEntryId } from "./GetPublishedRevisionByEntryId";
import { GetPublishedRevisionByEntryIdNotDeleted } from "./GetPublishedRevisionByEntryIdNotDeleted";
import type { CmsEntryStorageOperations } from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

interface GetPublishedRevisionByEntryIdUseCasesParams {
    operation: CmsEntryStorageOperations["getPublishedRevisionByEntryId"];
    transform: ITransformEntryCallable;
}

export const getPublishedRevisionByEntryIdUseCases = (
    params: GetPublishedRevisionByEntryIdUseCasesParams
) => {
    const getPublishedRevisionByEntryId = new GetPublishedRevisionByEntryId(
        params.operation,
        params.transform
    );
    const getPublishedRevisionByEntryIdNotDeleted = new GetPublishedRevisionByEntryIdNotDeleted(
        getPublishedRevisionByEntryId
    );

    return {
        getPublishedRevisionByEntryIdUseCase: getPublishedRevisionByEntryIdNotDeleted
    };
};
