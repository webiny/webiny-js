import { IGetPreviousRevisionByEntryId } from "../../adstractions";
import { CmsEntryStorageOperationsGetPreviousRevisionParams, CmsModel } from "~/types";

export class GetPreviousRevisionByEntryIdNotDeleted implements IGetPreviousRevisionByEntryId {
    private getPreviousRevisionByEntryId: IGetPreviousRevisionByEntryId;

    constructor(getPreviousRevisionByEntryId: IGetPreviousRevisionByEntryId) {
        this.getPreviousRevisionByEntryId = getPreviousRevisionByEntryId;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetPreviousRevisionParams) {
        const entry = await this.getPreviousRevisionByEntryId.execute(model, params);

        if (!entry || entry.deleted) {
            return null;
        }

        return entry;
    }
}
