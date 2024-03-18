import { GetRevisionsByEntryId } from "./GetRevisionsByEntryId";
import { GetRevisionsByEntryIdNotDeleted } from "./GetRevisionsByEntryIdNotDeleted";
import { CmsEntryStorageOperations } from "~/types";
import { AccessControl } from "~/crud/AccessControl/AccessControl";

interface GetRevisionsByEntryIdUseCasesParams {
    operation: CmsEntryStorageOperations["getRevisions"];
    accessControl: AccessControl;
}

export const getRevisionsByEntryIdUseCases = (params: GetRevisionsByEntryIdUseCasesParams) => {
    const getRevisionsByEntryId = new GetRevisionsByEntryId(params.operation);
    const getRevisionsByEntryIdNotDeleted = new GetRevisionsByEntryIdNotDeleted(
        getRevisionsByEntryId
    );

    return {
        getRevisionsByEntryIdUseCase: getRevisionsByEntryIdNotDeleted
    };
};
