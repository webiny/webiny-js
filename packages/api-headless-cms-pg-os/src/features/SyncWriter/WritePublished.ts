import type { CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { WritePublished as Abstraction } from "./abstractions/WritePublished.js";
import { BuildSyncRecord } from "./abstractions/BuildSyncRecord.js";
import { KnexClient } from "@webiny/api-core-sql";
import { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { ISyncRow } from "~/types.js";

class WritePublishedImpl implements Abstraction.Interface {
    public constructor(
        private readonly buildSyncRecord: BuildSyncRecord.Interface,
        private readonly knexClient: KnexClient.Interface,
        private readonly syncTableManager: SyncTableManager.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(params: Abstraction.Params<T>) {
        const row = await this.buildSyncRecord.execute({ ...params, kind: "published" });
        await this.query().insert(row).onConflict("id").merge();
    }

    private query() {
        return this.knexClient.client<ISyncRow>(this.syncTableManager.getTableName());
    }
}

export const WritePublished = Abstraction.createImplementation({
    implementation: WritePublishedImpl,
    dependencies: [BuildSyncRecord, KnexClient, SyncTableManager]
});
