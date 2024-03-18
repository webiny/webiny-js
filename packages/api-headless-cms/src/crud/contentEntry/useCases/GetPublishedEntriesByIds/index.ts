import { GetPublishedEntriesByIds } from "./GetPublishedEntriesByIds";
import { GetPublishedEntriesByIdsNotDeleted } from "./GetPublishedEntriesByIdsNotDeleted";
import { GetPublishedEntriesByIdsSecure } from "./GetPublishedEntriesByIdsSecure";
import { CmsEntryStorageOperations } from "~/types";
import { AccessControl } from "~/crud/AccessControl/AccessControl";

interface GetPublishedEntriesByIdsUseCasesParams {
    operation: CmsEntryStorageOperations["getPublishedByIds"];
    accessControl: AccessControl;
}

export const getPublishedEntriesByIdsUseCases = (
    params: GetPublishedEntriesByIdsUseCasesParams
) => {
    const getPublishedEntriesByIds = new GetPublishedEntriesByIds(params.operation);
    const getPublishedEntriesByIdsSecure = new GetPublishedEntriesByIdsSecure(
        params.accessControl,
        getPublishedEntriesByIds
    );
    const getPublishedEntriesByIdsNotDeleted = new GetPublishedEntriesByIdsNotDeleted(
        getPublishedEntriesByIdsSecure
    );

    return {
        getPublishedEntriesByIdsUseCase: getPublishedEntriesByIdsNotDeleted
    };
};
