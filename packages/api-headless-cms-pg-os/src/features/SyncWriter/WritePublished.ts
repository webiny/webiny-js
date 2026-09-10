import type { CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { WritePublished as Abstraction } from "./abstractions/WritePublished.js";
import { BuildSyncRecord } from "./abstractions/BuildSyncRecord.js";
import { SyncRowQuery } from "./abstractions/SyncRowQuery.js";

class WritePublishedImpl implements Abstraction.Interface {
    public constructor(
        private readonly buildSyncRecord: BuildSyncRecord.Interface,
        private readonly syncRowQuery: SyncRowQuery.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(params: Abstraction.Params<T>) {
        const row = await this.buildSyncRecord.execute({ ...params, kind: "published" });
        await this.syncRowQuery.create().insert(row).onConflict("id").merge();
    }
}

export const WritePublished = Abstraction.createImplementation({
    implementation: WritePublishedImpl,
    dependencies: [BuildSyncRecord, SyncRowQuery]
});
