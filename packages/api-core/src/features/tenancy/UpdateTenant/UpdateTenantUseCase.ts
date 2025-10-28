import { EventPublisher } from "@webiny/api-core";
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { UpdateTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateTenantRepository } from "./abstractions.js";
import { TenantBeforeUpdateEvent, TenantAfterUpdateEvent } from "./events.js";
import type { Tenant } from "~/types.js";
import { GetTenantByIdUseCase } from "~/features/GetTenantById/index.js";

class UpdateTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getTenantById: GetTenantByIdUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateTenantRepository.Interface
    ) {}

    async execute(id: string, data: Partial<Tenant>) {
        const result = await this.getTenantById.execute(id);

        if (result.isFail()) {
            return result;
        }
        const tenant = result.value;

        const updateData = { ...data, savedOn: new Date().toISOString() };

        await this.eventPublisher.publish(
            new TenantBeforeUpdateEvent({ tenant, inputData: data, updateData })
        );

        Object.assign(tenant, updateData);
        const updatedTenant = await this.repository.update(tenant);

        await this.eventPublisher.publish(
            new TenantAfterUpdateEvent({ tenant: updatedTenant, inputData: data })
        );

        return Result.ok(updatedTenant);
    }
}

export const UpdateTenantUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UpdateTenantUseCaseImpl,
    dependencies: [GetTenantByIdUseCase, EventPublisher, UpdateTenantRepository]
});
