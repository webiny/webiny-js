import { createImplementation } from "@webiny/feature/api";
import { ListTenantsGateway as GatewayAbstraction } from "./abstractions.js";
import type { ListTenantsParams } from "~/types/tenancy.js";
import { TenancyStorageOperations } from "~/features/tenancy/shared/storageOperations.js";

class ListTenantsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private storageOperations: TenancyStorageOperations.Interface) {}

    async listTenants(params?: ListTenantsParams) {
        return await this.storageOperations.listTenants(params);
    }
}

export const ListTenantsGateway = createImplementation({
    abstraction: GatewayAbstraction,
    implementation: ListTenantsGatewayImpl,
    dependencies: [TenancyStorageOperations]
});
