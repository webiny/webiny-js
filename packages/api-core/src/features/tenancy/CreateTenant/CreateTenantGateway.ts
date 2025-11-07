import { createImplementation } from "@webiny/di";
import { CreateTenantGateway as GatewayAbstraction } from "./abstractions.js";
import { TenancyStorageOperations } from "../shared/storageOperations.js";
import type { Tenant } from "~/types/tenancy.js";

class CreateTenantGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private storageOperations: TenancyStorageOperations.Interface) {}

    async createTenant(data: Tenant): Promise<Tenant> {
        return await this.storageOperations.createTenant(data);
    }
}

export const CreateTenantGateway = createImplementation({
    abstraction: GatewayAbstraction,
    implementation: CreateTenantGatewayImpl,
    dependencies: [TenancyStorageOperations]
});
