import { DisableTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { TenantAccess } from "~/api/features/TenantAccess/abstractions.js";
import { UpdateTenantUseCase as ApiCoreUpdateTenant } from "@webiny/api-core/features/tenancy/UpdateTenant";
import { UpdateTenantUseCase as TenantManagerUpdateTenant } from "../UpdateTenant/abstractions.js";
import { GetTenantByIdUseCase } from "../GetTenantById/abstractions.js";
import { TenantBeforeDisableEvent, TenantAfterDisableEvent } from "./events.js";
import { TenantPersistenceError } from "../../domain/errors.js";

class DisableTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantAccess: TenantAccess.Interface,
        private eventPublisher: EventPublisher.Interface,
        private coreUpdateTenant: ApiCoreUpdateTenant.Interface,
        private tmUpdateTenant: TenantManagerUpdateTenant.Interface,
        private tmGetTenantById: GetTenantByIdUseCase.Interface
    ) {}

    async execute(tenantId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Authorization checks
        const access = await this.tenantAccess.canManage(tenantId);
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        // Get current tenant to verify it exists
        const getTenantResult = await this.tmGetTenantById.execute(tenantId);
        if (getTenantResult.isFail()) {
            return Result.fail(getTenantResult.error);
        }

        const tenant = getTenantResult.value;

        // Publish before event
        await this.eventPublisher.publish(new TenantBeforeDisableEvent({ tenant }));

        // Update api-core tenant first
        const apiCoreResult = await this.coreUpdateTenant.execute(tenantId, {
            status: "disabled"
        });
        if (apiCoreResult.isFail()) {
            return Result.fail(
                new TenantPersistenceError(
                    new Error(`Failed to update api-core tenant: ${apiCoreResult.error}`)
                )
            );
        }

        // Update tenant-manager CMS entry
        const updateResult = await this.tmUpdateTenant.execute(tenantId, {
            status: "disabled"
        });

        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        // Publish after event
        await this.eventPublisher.publish(
            new TenantAfterDisableEvent({ tenant: updateResult.value })
        );

        return Result.ok();
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: DisableTenantUseCase,
    dependencies: [
        TenantAccess,
        EventPublisher,
        ApiCoreUpdateTenant,
        TenantManagerUpdateTenant,
        GetTenantByIdUseCase
    ]
});
