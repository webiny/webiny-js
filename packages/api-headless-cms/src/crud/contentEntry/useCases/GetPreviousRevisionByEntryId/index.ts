import { GetPreviousRevisionByEntryId } from "./GetPreviousRevisionByEntryId";
import { GetPreviousRevisionByEntryIdNotDeleted } from "./GetPreviousRevisionByEntryIdNotDeleted";
import { CmsEntryStorageOperations } from "~/types";

interface GetPreviousRevisionByEntryIdUseCasesParams {
    operation: CmsEntryStorageOperations["getPreviousRevision"];
}

export const getPreviousRevisionByEntryIdUseCases = (
    params: GetPreviousRevisionByEntryIdUseCasesParams
) => {
    const getPreviousRevisionByEntryId = new GetPreviousRevisionByEntryId(params.operation);
    const getPreviousRevisionByEntryIdNotDeleted = new GetPreviousRevisionByEntryIdNotDeleted(
        getPreviousRevisionByEntryId
    );

    return {
        getPreviousRevisionByEntryIdUseCase: getPreviousRevisionByEntryIdNotDeleted
    };
};
