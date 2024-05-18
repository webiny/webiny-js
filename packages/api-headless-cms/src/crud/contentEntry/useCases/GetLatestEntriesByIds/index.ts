import { GetLatestEntriesByIds } from "./GetLatestEntriesByIds";
import { GetLatestEntriesByIdsNotDeleted } from "./GetLatestEntriesByIdsNotDeleted";
import { GetLatestEntriesByIdsSecure } from "./GetLatestEntriesByIdsSecure";
import { CmsEntryStorageOperations } from "~/types";
import { AccessControl } from "~/crud/AccessControl/AccessControl";

interface GetLatestEntriesByIdsUseCasesParams {
    operation: CmsEntryStorageOperations["getLatestByIds"];
    accessControl: AccessControl;
}

export const getLatestEntriesByIdsUseCases = (params: GetLatestEntriesByIdsUseCasesParams) => {
    const getLatestEntriesByIds = new GetLatestEntriesByIds(params.operation);
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
