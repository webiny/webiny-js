import { WriteLatest as Abstraction } from "./abstractions/WriteLatest.js";
import { BuildSyncRecord } from "./abstractions/BuildSyncRecord.js";
import { KnexClient } from "@webiny/api-core-sql";
import { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { ISyncRow } from "~/types.js";

class WriteLatestImpl implements Abstraction.Interface {
    public constructor(
        private readonly buildSyncRecord: BuildSyncRecord.Interface,
        private readonly knexClient: KnexClient.Interface,
        private readonly syncTableManager: SyncTableManager.Interface
    ) {}

    public async execute(params: Abstraction.Params) {
        const row = await this.buildSyncRecord.execute({ ...params, kind: "latest" });
        await this.query().insert(row).onConflict("id").merge();
    }

    private query() {
        return this.knexClient.client<ISyncRow>(this.syncTableManager.getTableName());
    }
}

export const WriteLatest = Abstraction.createImplementation({
    implementation: WriteLatestImpl,
    dependencies: [BuildSyncRecord, KnexClient, SyncTableManager]
});
