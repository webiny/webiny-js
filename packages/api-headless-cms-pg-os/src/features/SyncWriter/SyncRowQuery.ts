import { SyncRowQuery as Abstraction } from "./abstractions/SyncRowQuery.js";
import { KnexClient } from "@webiny/api-core-sql";
import { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { ISyncRow } from "~/types.js";

class SyncRowQueryImpl implements Abstraction.Interface {
    public constructor(
        private readonly knexClient: KnexClient.Interface,
        private readonly syncTableManager: SyncTableManager.Interface
    ) {}

    public create() {
        return this.knexClient.client<ISyncRow>(this.syncTableManager.getTableName());
    }
}

export const SyncRowQuery = Abstraction.createImplementation({
    implementation: SyncRowQueryImpl,
    dependencies: [KnexClient, SyncTableManager]
});
