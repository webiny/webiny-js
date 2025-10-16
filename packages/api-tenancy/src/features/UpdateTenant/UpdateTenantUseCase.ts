import { createImplementation, Result } from "@webiny/feature/api";
import Error from "@webiny/error";
import type { Tenant } from "~/types.js";
import { UpdateTenantUseCase as UseCase, UpdateTenantRepository } from "./abstractions.js";
import { GetCurrentTenantUseCase, GetTenantByIdUseCase } from "~/features/index.js";

class DefaultUpdateTenantUseCase implements UseCase.Interface {
    constructor(
        private readonly getTenantByIdUseCase: GetTenantByIdUseCase.Interface,
        private readonly getCurrentTenantUseCase: GetCurrentTenantUseCase.Interface,
        private readonly updateTenantRepository: UpdateTenantRepository.Interface
    ) {}

    async execute(id: string, data: Partial<Tenant>): UseCase.Result {
        const tenantResult = await this.getTenantByIdUseCase.execute(id);
        const currentTenantResult = this.getCurrentTenantUseCase.execute();

        if (tenantResult.isFail()) {
            return tenantResult;
        }

        const currentTenant = currentTenantResult.value;
        const tenantToUpdate = tenantResult.value;

        const canUpdate = [
            // You can update a tenant if it's a child of the current tenant.
            currentTenant.id === tenantToUpdate.parent,
            // Root tenant can update itself
            currentTenant.id === "root" && tenantToUpdate.id === "root"
        ];

        // If not a single `true` is present in the array...
        if (!canUpdate.some(Boolean)) {
            throw new Error({
                message: `You can only update your own tenant, or a child tenant!`,
                code: "UPDATE_NOT_ALLOWED"
            });
        }

        const updatedTenant = { ...tenantToUpdate, ...data };

        await this.updateTenantRepository.execute(updatedTenant);

        return Result.ok(updatedTenant);
    }
}

export const UpdateTenantUseCase = createImplementation({
    abstraction: UseCase,
    implementation: DefaultUpdateTenantUseCase,
    dependencies: [GetTenantByIdUseCase, GetCurrentTenantUseCase, UpdateTenantRepository]
});
