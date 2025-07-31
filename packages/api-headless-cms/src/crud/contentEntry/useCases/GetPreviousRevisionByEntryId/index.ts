import { GetPreviousRevisionByEntryId } from "./GetPreviousRevisionByEntryId";
import { GetPreviousRevisionByEntryIdNotDeleted } from "./GetPreviousRevisionByEntryIdNotDeleted";
import type { CmsEntryStorageOperations } from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

interface GetPreviousRevisionByEntryIdUseCasesParams {
    operation: CmsEntryStorageOperations["getPreviousRevision"];
    transform: ITransformEntryCallable;
}

export const getPreviousRevisionByEntryIdUseCases = (
    params: GetPreviousRevisionByEntryIdUseCasesParams
) => {
    const getPreviousRevisionByEntryId = new GetPreviousRevisionByEntryId(
        params.operation,
        params.transform
    );
    const getPreviousRevisionByEntryIdNotDeleted = new GetPreviousRevisionByEntryIdNotDeleted(
        getPreviousRevisionByEntryId
    );

    return {
        getPreviousRevisionByEntryIdUseCase: getPreviousRevisionByEntryIdNotDeleted
    };
};
