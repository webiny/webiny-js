import { createFeature } from "@webiny/feature/api/index.js";
import { BuildSyncRecord } from "./BuildSyncRecord.js";
import { WriteEntry } from "./WriteEntry.js";
import { WriteLatest } from "./WriteLatest.js";
import { WritePublished } from "./WritePublished.js";
import { RemoveEntry } from "./RemoveEntry.js";
import { RemoveLatest } from "./RemoveLatest.js";
import { RemovePublished } from "./RemovePublished.js";
import { SyncRowQuery } from "./SyncRowQuery.js";
import { SyncHelpers } from "./SyncHelpers.js";

export const SyncWriterFeature = createFeature({
    name: "Cms/Pg/Os/SyncWriter",
    register(container) {
        container.register(SyncRowQuery);
        container.register(BuildSyncRecord);
        container.register(WriteEntry);
        container.register(WriteLatest);
        container.register(WritePublished);
        container.register(RemoveEntry);
        container.register(RemoveLatest);
        container.register(RemovePublished);
        container.register(SyncHelpers);
    }
});
