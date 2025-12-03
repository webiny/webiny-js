import { createImplementation } from "@webiny/di";
import { GetTenantByIdGateway as GatewayAbstraction } from "./abstractions.js";
import { TenancyStorageOperations } from "../shared/storageOperations.js";
import type { Tenant } from "~/types/tenancy.js";

class GetTenantByIdGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private storageOperations: TenancyStorageOperations.Interface) {}

    async getTenantById(id: string): Promise<Tenant | null> {
        const [tenant] = await this.storageOperations.getTenantsByIds([id]);
        return tenant || null;
    }
}

export const GetTenantByIdGateway = createImplementation({
    abstraction: GatewayAbstraction,
    implementation: GetTenantByIdGatewayImpl,
    dependencies: [TenancyStorageOperations]
});
