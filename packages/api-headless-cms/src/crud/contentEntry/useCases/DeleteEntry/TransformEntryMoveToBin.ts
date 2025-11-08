import { entryFromStorageTransform, entryToStorageTransform } from "~/utils/entryStorage.js";
import { getDate } from "~/utils/date.js";
import { getIdentity } from "~/utils/identity.js";
import type {
    CmsContext,
    CmsEntry,
    CmsEntryStorageOperationsMoveToBinParams,
    CmsModel
} from "~/types/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

export class TransformEntryMoveToBin {
    private context: CmsContext;
    private getIdentity: () => SecurityIdentity;

    constructor(context: CmsContext, getIdentity: () => SecurityIdentity) {
        this.context = context;
        this.getIdentity = getIdentity;
    }
    async execute(
        model: CmsModel,
        initialEntry: CmsEntry
    ): Promise<CmsEntryStorageOperationsMoveToBinParams> {
        const originalEntry = await entryFromStorageTransform(this.context, model, initialEntry);
        const entry = await this.createDeleteEntryData(model, originalEntry);
        const storageEntry = await entryToStorageTransform(this.context, model, entry);

        return {
            entry,
            storageEntry
        };
    }

    private async createDeleteEntryData(model: CmsModel, originalEntry: CmsEntry) {
        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.getIdentity();

        const entry: CmsEntry = {
            ...originalEntry,
            wbyDeleted: true,

            /**
             * Entry location fields. 👇
             */
            location: {
                folderId: ROOT_FOLDER
            },
            binOriginalFolderId: originalEntry.location?.folderId,

            /**
             * Entry-level meta fields. 👇
             */
            deletedOn: getDate(currentDateTime, null),
            deletedBy: getIdentity(currentIdentity, null),

            /**
             * Revision-level meta fields. 👇
             */
            revisionDeletedOn: getDate(currentDateTime, null),
            revisionDeletedBy: getIdentity(currentIdentity, null)
        };

        return entry;
    }
}
