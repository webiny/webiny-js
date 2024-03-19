import { IGetPublishedRevisionByEntryId } from "../../abstractions";
import { CmsEntryStorageOperationsGetPublishedRevisionParams, CmsModel } from "~/types";

export class GetPublishedRevisionByEntryIdNotDeleted implements IGetPublishedRevisionByEntryId {
    private getPublishedRevisionByEntryId: IGetPublishedRevisionByEntryId;

    constructor(getPublishedRevisionByEntryId: IGetPublishedRevisionByEntryId) {
        this.getPublishedRevisionByEntryId = getPublishedRevisionByEntryId;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetPublishedRevisionParams) {
        const entry = await this.getPublishedRevisionByEntryId.execute(model, params);

        if (!entry || entry.deleted) {
            return null;
        }

        return entry;
    }
}
