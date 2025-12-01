import { Result, createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { mdbid } from "@webiny/utils";
import { CreateTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateTenantRepository } from "./abstractions.js";
import { TenantBeforeCreateEvent, TenantAfterCreateEvent } from "./events.js";
import type { Tenant, CreateTenantInput } from "~/types/tenancy.js";
import { CreateTenantError } from "~/features/tenancy/CreateTenant/errors.js";

class CreateTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateTenantRepository.Interface
    ) {}

    async execute(data: CreateTenantInput) {
        const tenant: Tenant = {
            ...data,
            id: data.id ?? mdbid(),
            status: data.status || "active",
            isInstalled: false,
            settings: {
                ...(data.settings || {})
            },
            savedOn: new Date().toISOString(),
            createdOn: new Date().toISOString(),
            parent: data.parent || null,
        };

        await this.eventPublisher.publish(new TenantBeforeCreateEvent({ tenant, input: data }));

        let createdTenant: Tenant;
        try {
            createdTenant = await this.repository.create(tenant);
        } catch (e) {
            return Result.fail(new CreateTenantError({ reason: e.message }));
        }

        await this.eventPublisher.publish(
            new TenantAfterCreateEvent({ tenant: createdTenant, input: data })
        );

        return Result.ok(createdTenant);
    }
}

export const CreateTenantUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateTenantUseCaseImpl,
    dependencies: [EventPublisher, CreateTenantRepository]
});
