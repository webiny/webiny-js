import { RemoveLatest as Abstraction } from "./abstractions/RemoveLatest.js";
import { SyncRowQuery } from "./abstractions/SyncRowQuery.js";

class RemoveLatestImpl implements Abstraction.Interface {
    public constructor(private readonly syncRowQuery: SyncRowQuery.Interface) {}

    public async execute(params: Abstraction.Params) {
        await this.syncRowQuery.create().where("id", `${params.entryId}:L`).delete();
    }
}

export const RemoveLatest = Abstraction.createImplementation({
    implementation: RemoveLatestImpl,
    dependencies: [SyncRowQuery]
});
