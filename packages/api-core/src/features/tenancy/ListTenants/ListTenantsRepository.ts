import { createImplementation } from "@webiny/feature/api";
import { ListTenantsRepository as RepositoryAbstraction } from "./abstractions.js";
import { ListTenantsGateway } from "./abstractions.js";
import type { ListTenantsParams } from "~/types.js";

class ListTenantsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: ListTenantsGateway.Interface) {}

    async list(params?: ListTenantsParams) {
        return await this.gateway.listTenants(params);
    }
}

export const ListTenantsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: ListTenantsRepositoryImpl,
    dependencies: [ListTenantsGateway]
});
