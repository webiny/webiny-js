import { IGetLatestRevisionByEntryId } from "../../abstractions";
import { CmsEntryStorageOperationsGetLatestRevisionParams, CmsModel } from "~/types";

export class GetLatestRevisionByEntryIdNotDeleted implements IGetLatestRevisionByEntryId {
    private getLatestRevisionByEntryId: IGetLatestRevisionByEntryId;

    constructor(getLatestRevisionByEntryId: IGetLatestRevisionByEntryId) {
        this.getLatestRevisionByEntryId = getLatestRevisionByEntryId;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetLatestRevisionParams) {
        const entry = await this.getLatestRevisionByEntryId.execute(model, params);

        if (!entry || entry.wbyDeleted) {
            return null;
        }

        return entry;
    }
}
