import { GetPublishedRevisionByEntryId } from "./GetPublishedRevisionByEntryId";
import { GetPublishedRevisionByEntryIdNotDeleted } from "./GetPublishedRevisionByEntryIdNotDeleted";
import { CmsEntryStorageOperations } from "~/types";

interface GetPublishedRevisionByEntryIdUseCasesParams {
    operation: CmsEntryStorageOperations["getPublishedRevisionByEntryId"];
}

export const getPublishedRevisionByEntryIdUseCases = (
    params: GetPublishedRevisionByEntryIdUseCasesParams
) => {
    const getPublishedRevisionByEntryId = new GetPublishedRevisionByEntryId(params.operation);
    const getPublishedRevisionByEntryIdNotDeleted = new GetPublishedRevisionByEntryIdNotDeleted(
        getPublishedRevisionByEntryId
    );

    return {
        getPublishedRevisionByEntryIdUseCase: getPublishedRevisionByEntryIdNotDeleted
    };
};
