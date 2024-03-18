import { IGetEntriesByIds } from "../../adstractions";
import { CmsEntryStorageOperationsGetByIdsParams, CmsModel } from "~/types";

export class GetEntriesByIdsNotDeleted implements IGetEntriesByIds {
    private getEntriesByIds: IGetEntriesByIds;

    constructor(getEntriesByIds: IGetEntriesByIds) {
        this.getEntriesByIds = getEntriesByIds;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetByIdsParams) {
        const entries = await this.getEntriesByIds.execute(model, params);
        return entries.filter(entry => !entry.deleted);
    }
}
