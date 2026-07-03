import {
    BulkActionRepository as RepositoryAbstraction,
    BulkActionGateway
} from "./abstractions.js";
import type { IBulkActionParams } from "./abstractions.js";

class BulkActionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: BulkActionGateway.Interface) {}

    async execute(params: IBulkActionParams) {
        return this.gateway.execute(params);
    }
}

export const BulkActionRepository = RepositoryAbstraction.createImplementation({
    implementation: BulkActionRepositoryImpl,
    dependencies: [BulkActionGateway]
});
