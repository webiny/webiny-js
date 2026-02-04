import { EnableTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { UpdateTenantUseCase as ApiCoreUpdateTenant } from "@webiny/api-core/features/tenancy/UpdateTenant";
import { UpdateTenantUseCase as TenantManagerUpdateTenant } from "../UpdateTenant/abstractions.js";
import { GetTenantByIdUseCase } from "../GetTenantById/abstractions.js";
import { TenantBeforeEnableEvent, TenantAfterEnableEvent } from "./events.js";
import { TenantPersistenceError } from "../../domain/errors.js";

class EnableTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private coreUpdateTenant: ApiCoreUpdateTenant.Interface,
        private tmUpdateTenant: TenantManagerUpdateTenant.Interface,
        private tmGetTenantById: GetTenantByIdUseCase.Interface
    ) {}

    async execute(tenantId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Authorization checks
        const identity = this.identityContext.getIdentity();
        if (!identity.isAdmin() || !this.identityContext.getPermission("tm.tenant")) {
            return Result.fail(
                new NotAuthorizedError({ message: "Not authorized to enable tenants." })
            );
        }

        // Get current tenant to verify it exists
        const getTenantResult = await this.tmGetTenantById.execute(tenantId);
        if (getTenantResult.isFail()) {
            return Result.fail(getTenantResult.error);
        }

        const tenant = getTenantResult.value;

        // Publish before event
        await this.eventPublisher.publish(new TenantBeforeEnableEvent({ tenant }));

        // Update api-core tenant first
        const apiCoreResult = await this.coreUpdateTenant.execute(tenantId, {
            status: "enabled"
        });

        if (apiCoreResult.isFail()) {
            return Result.fail(
                new TenantPersistenceError(
                    new Error(`Failed to update api-core tenant: ${apiCoreResult.error}`)
                )
            );
        }

        // Update tenant-manager CMS entry
        const updatedTenantResult = await this.tmUpdateTenant.execute(tenantId, {
            status: "enabled"
        });

        if (updatedTenantResult.isFail()) {
            return Result.fail(updatedTenantResult.error);
        }

        // Publish after event
        await this.eventPublisher.publish(
            new TenantAfterEnableEvent({ tenant: updatedTenantResult.value })
        );

        return Result.ok();
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: EnableTenantUseCase,
    dependencies: [
        IdentityContext,
        EventPublisher,
        ApiCoreUpdateTenant,
        TenantManagerUpdateTenant,
        GetTenantByIdUseCase
    ]
});
