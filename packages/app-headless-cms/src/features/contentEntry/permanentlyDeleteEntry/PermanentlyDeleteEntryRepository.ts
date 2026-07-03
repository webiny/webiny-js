import {
    PermanentlyDeleteEntryRepository as RepositoryAbstraction,
    PermanentlyDeleteEntryGateway
} from "./abstractions.js";
import type { IPermanentlyDeleteEntryParams } from "./abstractions.js";

class PermanentlyDeleteEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: PermanentlyDeleteEntryGateway.Interface) {}

    async execute(params: IPermanentlyDeleteEntryParams) {
        return this.gateway.execute(params);
    }
}

export const PermanentlyDeleteEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: PermanentlyDeleteEntryRepositoryImpl,
    dependencies: [PermanentlyDeleteEntryGateway]
});
