import { GetRevisionsByEntryId } from "./GetRevisionsByEntryId";
import { GetRevisionsByEntryIdNotDeleted } from "./GetRevisionsByEntryIdNotDeleted";
import type { CmsEntryStorageOperations } from "~/types";
import type { AccessControl } from "~/crud/AccessControl/AccessControl";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

interface GetRevisionsByEntryIdUseCasesParams {
    operation: CmsEntryStorageOperations["getRevisions"];
    accessControl: AccessControl;
    transform: ITransformEntryCallable;
}

export const getRevisionsByEntryIdUseCases = (params: GetRevisionsByEntryIdUseCasesParams) => {
    const getRevisionsByEntryId = new GetRevisionsByEntryId(params.operation, params.transform);
    const getRevisionsByEntryIdNotDeleted = new GetRevisionsByEntryIdNotDeleted(
        getRevisionsByEntryId
    );

    return {
        getRevisionsByEntryIdUseCase: getRevisionsByEntryIdNotDeleted
    };
};
