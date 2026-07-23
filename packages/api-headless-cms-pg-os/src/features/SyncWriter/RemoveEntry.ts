import { RemoveEntry as Abstraction } from "./abstractions/RemoveEntry.js";
import { SyncRowQuery } from "./abstractions/SyncRowQuery.js";

class RemoveEntryImpl implements Abstraction.Interface {
    public constructor(private readonly syncRowQuery: SyncRowQuery.Interface) {}

    public async execute(params: Abstraction.Params) {
        const { entryId } = params;
        await this.syncRowQuery
            .create()
            .whereIn("id", [`${entryId}:L`, `${entryId}:P`])
            .delete();
    }
}

export const RemoveEntry = Abstraction.createImplementation({
    implementation: RemoveEntryImpl,
    dependencies: [SyncRowQuery]
});
