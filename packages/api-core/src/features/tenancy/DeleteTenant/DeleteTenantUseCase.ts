import { createImplementation } from "@webiny/di-container";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { DeleteTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteTenantRepository } from "./abstractions.js";
import { TenantBeforeDeleteEvent, TenantAfterDeleteEvent } from "./events.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";

export class DeleteTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getTenantById: GetTenantByIdUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: DeleteTenantRepository.Interface
    ) {}

    async execute(id: string): Promise<boolean> {
        const result = await this.getTenantById.execute(id);

        if (result.isFail()) {
            return false;
        }

        const tenant = result.value;

        await this.eventPublisher.publish(new TenantBeforeDeleteEvent({ tenant }));

        await this.repository.delete(id);

        await this.eventPublisher.publish(new TenantAfterDeleteEvent({ tenant }));

        return true;
    }
}

export const DeleteTenantUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteTenantUseCaseImpl,
    dependencies: [GetTenantByIdUseCase, EventPublisher, DeleteTenantRepository]
});
