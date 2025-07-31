import { GetEntriesByIds } from "./GetEntriesByIds";
import { GetEntriesByIdsSecure } from "./GetEntriesByIdsSecure";
import { GetEntriesByIdsNotDeleted } from "./GetEntriesByIdsNotDeleted";
import type { AccessControl } from "~/crud/AccessControl/AccessControl";
import type { CmsEntryStorageOperations } from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

interface GetEntriesByIdsUseCasesParams {
    operation: CmsEntryStorageOperations["getByIds"];
    accessControl: AccessControl;
    transform: ITransformEntryCallable;
}

export const getEntriesByIdsUseCases = (params: GetEntriesByIdsUseCasesParams) => {
    const getEntriesByIds = new GetEntriesByIds(params.operation, params.transform);
    const getEntriesByIdsSecure = new GetEntriesByIdsSecure(params.accessControl, getEntriesByIds);
    const getEntriesByIdsNotDeleted = new GetEntriesByIdsNotDeleted(getEntriesByIdsSecure);

    return {
        getEntriesByIdsUseCase: getEntriesByIdsNotDeleted
    };
};
