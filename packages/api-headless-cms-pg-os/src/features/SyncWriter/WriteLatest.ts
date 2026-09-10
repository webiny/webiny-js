import type { CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { WriteLatest as Abstraction } from "./abstractions/WriteLatest.js";
import { BuildSyncRecord } from "./abstractions/BuildSyncRecord.js";
import { SyncRowQuery } from "./abstractions/SyncRowQuery.js";

class WriteLatestImpl implements Abstraction.Interface {
    public constructor(
        private readonly buildSyncRecord: BuildSyncRecord.Interface,
        private readonly syncRowQuery: SyncRowQuery.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(params: Abstraction.Params<T>) {
        const row = await this.buildSyncRecord.execute({ ...params, kind: "latest" });
        await this.syncRowQuery.create().insert(row).onConflict("id").merge();
    }
}

export const WriteLatest = Abstraction.createImplementation({
    implementation: WriteLatestImpl,
    dependencies: [BuildSyncRecord, SyncRowQuery]
});
