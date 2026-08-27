import type { CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { WriteEntry as Abstraction } from "./abstractions/WriteEntry.js";
import { BuildSyncRecord } from "./abstractions/BuildSyncRecord.js";
import { SyncRowQuery } from "./abstractions/SyncRowQuery.js";
import type { ISyncRow } from "~/types.js";

class WriteEntryImpl implements Abstraction.Interface {
    public constructor(
        private readonly buildSyncRecord: BuildSyncRecord.Interface,
        private readonly syncRowQuery: SyncRowQuery.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(params: Abstraction.Params<T>) {
        const rows: ISyncRow[] = [
            await this.buildSyncRecord.execute({ ...params, kind: "latest" })
        ];

        if (params.entry.status === "published") {
            rows.push(await this.buildSyncRecord.execute({ ...params, kind: "published" }));
        }

        await this.syncRowQuery.create().insert(rows).onConflict("id").merge();
    }
}

export const WriteEntry = Abstraction.createImplementation({
    implementation: WriteEntryImpl,
    dependencies: [BuildSyncRecord, SyncRowQuery]
});
