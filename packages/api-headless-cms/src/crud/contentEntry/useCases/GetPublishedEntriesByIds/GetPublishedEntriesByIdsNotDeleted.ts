import { IGetPublishedEntriesByIds } from "../../adstractions";
import { CmsEntryStorageOperationsGetPublishedByIdsParams, CmsModel } from "~/types";

export class GetPublishedEntriesByIdsNotDeleted implements IGetPublishedEntriesByIds {
    private getPublishedEntriesByIds: IGetPublishedEntriesByIds;

    constructor(getLatestEntriesByIds: IGetPublishedEntriesByIds) {
        this.getPublishedEntriesByIds = getLatestEntriesByIds;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetPublishedByIdsParams) {
        const entries = await this.getPublishedEntriesByIds.execute(model, params);
        return entries.filter(entry => !entry.deleted);
    }
}
