import { GetLatestRevisionByEntryId } from "./GetLatestRevisionByEntryId";
import { GetLatestRevisionByEntryIdNotDeleted } from "./GetLatestRevisionByEntryIdNotDeleted";
import { CmsEntryStorageOperations } from "~/types";

interface GetLatestRevisionByEntryIdUseCasesParams {
    operation: CmsEntryStorageOperations["getLatestRevisionByEntryId"];
}

export const getLatestRevisionByEntryIdUseCases = (
    params: GetLatestRevisionByEntryIdUseCasesParams
) => {
    const getLatestRevisionByEntryId = new GetLatestRevisionByEntryId(params.operation);
    const getLatestRevisionByEntryIdNotDeleted = new GetLatestRevisionByEntryIdNotDeleted(
        getLatestRevisionByEntryId
    );

    return {
        getLatestRevisionByEntryIdUseCase: getLatestRevisionByEntryIdNotDeleted,
        getLatestRevisionByEntryIdWithDeletedUseCase: getLatestRevisionByEntryId
    };
};
