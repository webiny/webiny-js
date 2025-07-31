import { GetLatestEntriesByIds } from "./GetLatestEntriesByIds";
import { GetLatestEntriesByIdsNotDeleted } from "./GetLatestEntriesByIdsNotDeleted";
import { GetLatestEntriesByIdsSecure } from "./GetLatestEntriesByIdsSecure";
import type { CmsEntryStorageOperations } from "~/types";
import type { AccessControl } from "~/crud/AccessControl/AccessControl";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

interface GetLatestEntriesByIdsUseCasesParams {
    operation: CmsEntryStorageOperations["getLatestByIds"];
    accessControl: AccessControl;
    transform: ITransformEntryCallable;
}

export const getLatestEntriesByIdsUseCases = (params: GetLatestEntriesByIdsUseCasesParams) => {
    const getLatestEntriesByIds = new GetLatestEntriesByIds(params.operation, params.transform);
    const getLatestEntriesByIdsSecure = new GetLatestEntriesByIdsSecure(
        params.accessControl,
        getLatestEntriesByIds
    );
    const getLatestEntriesByIdsNotDeleted = new GetLatestEntriesByIdsNotDeleted(
        getLatestEntriesByIdsSecure
    );

    return {
        getLatestEntriesByIdsUseCase: getLatestEntriesByIdsNotDeleted
    };
};
