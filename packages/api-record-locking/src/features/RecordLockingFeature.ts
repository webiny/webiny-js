import { createFeature } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { RecordLockingConfig, RecordLockingModel } from "~/domain/abstractions.js";
import { GetLockRecordFeature } from "./GetLockRecord/feature.js";
import { GetLockedEntryLockRecordFeature } from "./GetLockedEntryLockRecord/feature.js";
import { KickOutCurrentUserFeature } from "./KickOutCurrentUser/feature.js";
import { ListLockRecordsFeature } from "./ListLockRecords/feature.js";
import { ListAllLockRecordsFeature } from "./ListAllLockRecords/feature.js";
import { IsEntryLockedFeature } from "./IsEntryLocked/feature.js";
import { LockEntryFeature } from "./LockEntry/feature.js";
import { UpdateEntryLockFeature } from "./UpdateEntryLock/feature.js";
import { UnlockEntryFeature } from "./UnlockEntry/feature.js";
import { UnlockEntryRequestFeature } from "./UnlockEntryRequest/feature.js";

export interface RecordLockingParams {
    /**
     * Timeout in milliseconds after which a lock expires
     */
    timeout: number;
    /**
     * The CMS model for storing lock records
     */
    model: CmsModel;
}

export const RecordLockingFeature = createFeature({
    name: "RecordLockingManagement",
    register(container, params: RecordLockingParams) {
        // Register domain abstractions
        container.registerInstance(RecordLockingConfig, { timeout: params.timeout });
        container.registerInstance(RecordLockingModel, params.model);

        // Register all sub-features
        GetLockRecordFeature.register(container);
        GetLockedEntryLockRecordFeature.register(container);
        KickOutCurrentUserFeature.register(container);
        ListLockRecordsFeature.register(container);
        ListAllLockRecordsFeature.register(container);
        IsEntryLockedFeature.register(container);
        LockEntryFeature.register(container);
        UpdateEntryLockFeature.register(container);
        UnlockEntryFeature.register(container);
        UnlockEntryRequestFeature.register(container);
    }
});
