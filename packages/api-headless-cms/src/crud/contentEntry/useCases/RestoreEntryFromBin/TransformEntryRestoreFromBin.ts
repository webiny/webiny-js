import { entryFromStorageTransform, entryToStorageTransform } from "~/utils/entryStorage.js";
import { getDate } from "~/utils/date.js";
import { getIdentity } from "~/utils/identity.js";
import type {
    CmsContext,
    CmsEntry,
    CmsEntryStorageOperationsMoveToBinParams,
    CmsModel
} from "~/types/index.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

export class TransformEntryRestoreFromBin {
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
        const entry = await this.createRestoreFromBinEntryData(model, originalEntry);
        const storageEntry = await entryToStorageTransform(this.context, model, entry);

        return {
            entry,
            storageEntry
        };
    }

    private async createRestoreFromBinEntryData(model: CmsModel, originalEntry: CmsEntry) {
        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.getIdentity();

        const entry: CmsEntry = {
            ...originalEntry,
            wbyDeleted: false,

            /**
             * Entry location fields. 👇
             */
            location: {
                folderId: originalEntry.binOriginalFolderId
            },
            binOriginalFolderId: null,

            /**
             * Entry-level meta fields. 👇
             */
            restoredOn: getDate(currentDateTime, null),
            restoredBy: getIdentity(currentIdentity, null),

            /**
             * Revision-level meta fields. 👇
             */
            revisionRestoredOn: getDate(currentDateTime, null),
            revisionRestoredBy: getIdentity(currentIdentity, null)
        };

        return entry;
    }
}
