import { IGetRevisionsByEntryId } from "../../abstractions";
import { CmsEntryStorageOperationsGetRevisionParams, CmsModel } from "~/types";

export class GetRevisionsByEntryIdNotDeleted implements IGetRevisionsByEntryId {
    private getRevisionsByEntryId: IGetRevisionsByEntryId;

    constructor(getRevisionsByEntryId: IGetRevisionsByEntryId) {
        this.getRevisionsByEntryId = getRevisionsByEntryId;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetRevisionParams) {
        const entries = await this.getRevisionsByEntryId.execute(model, params);
        return entries.filter(entry => !entry.wbyDeleted);
    }
}
