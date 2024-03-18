import { GetEntriesByIds } from "./GetEntriesByIds";
import { GetEntriesByIdsSecure } from "./GetEntriesByIdsSecure";
import { GetEntriesByIdsNotDeleted } from "./GetEntriesByIdsNotDeleted";
import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { CmsEntryStorageOperations } from "~/types";

interface GetEntriesByIdsUseCasesParams {
    operation: CmsEntryStorageOperations["getByIds"];
    accessControl: AccessControl;
}

export const getEntriesByIdsUseCases = (params: GetEntriesByIdsUseCasesParams) => {
    const getEntriesByIds = new GetEntriesByIds(params.operation);
    const getEntriesByIdsSecure = new GetEntriesByIdsSecure(params.accessControl, getEntriesByIds);
    const getEntriesByIdsNotDeleted = new GetEntriesByIdsNotDeleted(getEntriesByIdsSecure);

    return {
        getEntriesByIdsUseCase: getEntriesByIdsNotDeleted
    };
};
