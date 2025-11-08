import { createImplementation } from "@webiny/feature/api";
import { UpdateTenantGateway as GatewayAbstraction } from "./abstractions.js";
import { type Tenant } from "~/types/tenancy.js";
import { TenancyStorageOperations } from "~/features/tenancy/shared/storageOperations.js";

class UpdateTenantGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private storageOperations: TenancyStorageOperations.Interface) {}

    async updateTenant(data: Tenant) {
        return await this.storageOperations.updateTenant(data);
    }
}

export const UpdateTenantGateway = createImplementation({
    abstraction: GatewayAbstraction,
    implementation: UpdateTenantGatewayImpl,
    dependencies: [TenancyStorageOperations]
});
