import { RemoveEntry as Abstraction } from "./abstractions/RemoveEntry.js";
import { KnexClient } from "@webiny/api-core-sql";
import { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { ISyncRow } from "~/types.js";

class RemoveEntryImpl implements Abstraction.Interface {
    public constructor(
        private readonly knexClient: KnexClient.Interface,
        private readonly syncTableManager: SyncTableManager.Interface
    ) {}

    public async execute(params: Abstraction.Params) {
        const { entryId } = params;
        await this.query()
            .whereIn("id", [`${entryId}:L`, `${entryId}:P`])
            .delete();
    }

    private query() {
        return this.knexClient.client<ISyncRow>(this.syncTableManager.getTableName());
    }
}

export const RemoveEntry = Abstraction.createImplementation({
    implementation: RemoveEntryImpl,
    dependencies: [KnexClient, SyncTableManager]
});
