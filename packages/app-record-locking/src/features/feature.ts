import { createFeature } from "@webiny/feature/admin";
import { AcquireLockFeature } from "./acquireLock/feature.js";
import { ReleaseLockFeature } from "./releaseLock/feature.js";
import { ForceUnlockFeature } from "./forceUnlock/feature.js";
import { CheckLockStatusFeature } from "./checkLockStatus/feature.js";
import { ListLockRecordsFeature } from "./listLockRecords/feature.js";

export const RecordLockingFeature = createFeature({
    name: "RecordLocking",
    register(container) {
        AcquireLockFeature.register(container);
        ReleaseLockFeature.register(container);
        ForceUnlockFeature.register(container);
        CheckLockStatusFeature.register(container);
        ListLockRecordsFeature.register(container);
    }
});
