import { IGetLatestEntriesByIds } from "../../abstractions";
import { CmsEntryStorageOperationsGetLatestByIdsParams, CmsModel } from "~/types";

export class GetLatestEntriesByIdsNotDeleted implements IGetLatestEntriesByIds {
    private getLatestEntriesByIds: IGetLatestEntriesByIds;

    constructor(getLatestEntriesByIds: IGetLatestEntriesByIds) {
        this.getLatestEntriesByIds = getLatestEntriesByIds;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetLatestByIdsParams) {
        const entries = await this.getLatestEntriesByIds.execute(model, params);
        return entries.filter(entry => !entry.deleted);
    }
}
