import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { filterAsync } from "~/utils/filterAsync";
import { IGetEntriesByIds } from "../../abstractions";
import { CmsEntryStorageOperationsGetByIdsParams, CmsModel } from "~/types";

export class GetEntriesByIdsSecure implements IGetEntriesByIds {
    private accessControl: AccessControl;
    private getEntriesByIds: IGetEntriesByIds;

    constructor(accessControl: AccessControl, getEntriesByIds: IGetEntriesByIds) {
        this.accessControl = accessControl;
        this.getEntriesByIds = getEntriesByIds;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetByIdsParams) {
        await this.accessControl.ensureCanAccessEntry({ model });

        const entries = await this.getEntriesByIds.execute(model, params);

        return filterAsync(entries, async entry => {
            return this.accessControl.canAccessEntry({ model, entry });
        });
    }
}
