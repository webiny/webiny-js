import { RemovePublished as Abstraction } from "./abstractions/RemovePublished.js";
import { SyncRowQuery } from "./abstractions/SyncRowQuery.js";

class RemovePublishedImpl implements Abstraction.Interface {
    public constructor(private readonly syncRowQuery: SyncRowQuery.Interface) {}

    public async execute(params: Abstraction.Params) {
        await this.syncRowQuery.create().where("id", `${params.entryId}:P`).delete();
    }
}

export const RemovePublished = Abstraction.createImplementation({
    implementation: RemovePublishedImpl,
    dependencies: [SyncRowQuery]
});
