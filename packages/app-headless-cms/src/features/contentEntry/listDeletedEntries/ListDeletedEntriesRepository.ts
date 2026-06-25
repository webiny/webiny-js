import {
    ListDeletedEntriesRepository as RepositoryAbstraction,
    ListDeletedEntriesGateway
} from "./abstractions.js";
import type { IListDeletedEntriesParams } from "./abstractions.js";

class ListDeletedEntriesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: ListDeletedEntriesGateway.Interface) {}

    async execute(params: IListDeletedEntriesParams) {
        return this.gateway.execute(params);
    }
}

export const ListDeletedEntriesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListDeletedEntriesRepositoryImpl,
    dependencies: [ListDeletedEntriesGateway]
});
