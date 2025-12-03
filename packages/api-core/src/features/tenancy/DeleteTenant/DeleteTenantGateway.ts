import { createImplementation } from "@webiny/feature/api";
import { DeleteTenantGateway as GatewayAbstraction } from "./abstractions.js";
import { TenancyStorageOperations } from "../shared/storageOperations.js";

export class DeleteTenantGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private storageOperations: TenancyStorageOperations.Interface) {}

    async deleteTenant(id: string): Promise<void> {
        return await this.storageOperations.deleteTenant(id);
    }
}

export const DeleteTenantGateway = createImplementation({
    abstraction: GatewayAbstraction,
    implementation: DeleteTenantGatewayImpl,
    dependencies: [TenancyStorageOperations]
});
