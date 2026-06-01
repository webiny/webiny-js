import {
    ListRevisionsRepository as RepositoryAbstraction,
    ListRevisionsGateway
} from "./abstractions.js";
import type { IListRevisionsParams } from "./abstractions.js";

class ListRevisionsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: ListRevisionsGateway.Interface) {}

    async execute(params: IListRevisionsParams) {
        return this.gateway.execute(params);
    }
}

export const ListRevisionsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListRevisionsRepositoryImpl,
    dependencies: [ListRevisionsGateway]
});
