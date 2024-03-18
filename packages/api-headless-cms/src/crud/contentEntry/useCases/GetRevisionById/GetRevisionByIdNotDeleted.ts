import { IGetRevisionById } from "../../adstractions";
import { CmsEntryStorageOperationsGetRevisionParams, CmsModel } from "~/types";

export class GetRevisionByIdNotDeleted implements IGetRevisionById {
    private getRevisionById: IGetRevisionById;

    constructor(getRevisionById: IGetRevisionById) {
        this.getRevisionById = getRevisionById;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetRevisionParams) {
        const entry = await this.getRevisionById.execute(model, params);

        if (!entry || entry.deleted) {
            return null;
        }

        return entry;
    }
}
