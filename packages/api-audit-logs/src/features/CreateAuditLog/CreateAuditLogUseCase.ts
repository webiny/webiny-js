import { mdbid } from "@webiny/utils/mdbid.js";
import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { AuditLogsConfig } from "~/abstractions.js";
import { AuditLogPermissions } from "~/features/AuditLogPermissions/abstractions.js";
import { AuditLogBeforeCreateEvent } from "~/events/index.js";
import { AuditLogAfterCreateEvent } from "~/events/index.js";
import { convertExpiresAtDaysToDate } from "~/utils/expiresAt.js";
import type { AuditLogPayload } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import { CreateAuditLogUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateAuditLogRepository } from "./abstractions.js";

class CreateAuditLogUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: CreateAuditLogRepository.Interface,
        private readonly permissions: AuditLogPermissions.Interface,
        private readonly eventPublisher: EventPublisher.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly config: AuditLogsConfig.Interface
    ) {}

    public async execute(
        payload: AuditLogPayload
    ): Promise<Result<IAuditLog, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        const expiresAt = convertExpiresAtDaysToDate(this.config.deleteLogsAfterDays);

        const auditLog: IAuditLog = {
            id: mdbid(),
            tenant: this.tenantContext.getTenant().id,
            createdBy: {
                id: identity.id,
                type: identity.type,
                displayName: identity.displayName || "unknown"
            },
            createdOn: new Date(),
            ...payload,
            content: JSON.stringify(payload.content),
            expiresAt
        };

        const canAccess = await this.permissions.canAccess(auditLog.action);
        if (!canAccess) {
            return Result.fail(
                new NotAuthorizedError({ message: "You cannot access audit logs." })
            );
        }

        const beforeCreateEvent = new AuditLogBeforeCreateEvent({
            auditLog,
            setAuditLog(input) {
                Object.assign(auditLog, input);
            }
        });
        await this.eventPublisher.publish(beforeCreateEvent);

        const result = await this.repository.create(auditLog);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const afterCreateEvent = new AuditLogAfterCreateEvent({ auditLog });
        await this.eventPublisher.publish(afterCreateEvent);

        return Result.ok(result.value);
    }
}

export const CreateAuditLogUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateAuditLogUseCaseImpl,
    dependencies: [
        CreateAuditLogRepository,
        AuditLogPermissions,
        EventPublisher,
        IdentityContext,
        TenantContext,
        AuditLogsConfig
    ]
});
