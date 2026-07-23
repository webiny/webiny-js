import { WriteEntry as Abstraction } from "./abstractions/WriteEntry.js";
import { BuildSyncRecord } from "./abstractions/BuildSyncRecord.js";
import { KnexClient } from "@webiny/api-core-sql";
import { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { ISyncRow } from "~/types.js";

class WriteEntryImpl implements Abstraction.Interface {
    public constructor(
        private readonly buildSyncRecord: BuildSyncRecord.Interface,
        private readonly knexClient: KnexClient.Interface,
        private readonly syncTableManager: SyncTableManager.Interface
    ) {}

    public async execute(params: Abstraction.Params) {
        const rows: ISyncRow[] = [
            await this.buildSyncRecord.execute({ ...params, kind: "latest" })
        ];

        if (params.entry.status === "published") {
            rows.push(await this.buildSyncRecord.execute({ ...params, kind: "published" }));
        }

        await this.query().insert(rows).onConflict("id").merge();
    }

    private query() {
        return this.knexClient.client<ISyncRow>(this.syncTableManager.getTableName());
    }
}

export const WriteEntry = Abstraction.createImplementation({
    implementation: WriteEntryImpl,
    dependencies: [BuildSyncRecord, KnexClient, SyncTableManager]
});
