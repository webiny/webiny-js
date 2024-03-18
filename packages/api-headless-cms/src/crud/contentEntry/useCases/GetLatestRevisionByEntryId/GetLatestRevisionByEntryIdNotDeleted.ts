import { IGetLatestRevisionByEntryId } from "../../adstractions";
import { CmsEntryStorageOperationsGetLatestRevisionParams, CmsModel } from "~/types";

export class GetLatestRevisionByEntryIdNotDeleted implements IGetLatestRevisionByEntryId {
    private getLatestRevisionByEntryId: IGetLatestRevisionByEntryId;

    constructor(getLatestRevisionByEntryId: IGetLatestRevisionByEntryId) {
        this.getLatestRevisionByEntryId = getLatestRevisionByEntryId;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetLatestRevisionParams) {
        const entry = await this.getLatestRevisionByEntryId.execute(model, params);

        if (!entry || entry.deleted) {
            return null;
        }

        return entry;
    }
}
