import { RemovePublished as Abstraction } from "./abstractions/RemovePublished.js";
import { KnexClient } from "@webiny/api-core-sql";
import { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { ISyncRow } from "~/types.js";

class RemovePublishedImpl implements Abstraction.Interface {
    public constructor(
        private readonly knexClient: KnexClient.Interface,
        private readonly syncTableManager: SyncTableManager.Interface
    ) {}

    public async execute(params: Abstraction.Params) {
        await this.query().where("id", `${params.entryId}:P`).delete();
    }

    private query() {
        return this.knexClient.client<ISyncRow>(this.syncTableManager.getTableName());
    }
}

export const RemovePublished = Abstraction.createImplementation({
    implementation: RemovePublishedImpl,
    dependencies: [KnexClient, SyncTableManager]
});
