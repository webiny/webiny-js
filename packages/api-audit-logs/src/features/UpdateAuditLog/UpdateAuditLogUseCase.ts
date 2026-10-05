import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { AuditLogPermissions } from "~/features/AuditLogPermissions/abstractions.js";
import { AuditLogBeforeUpdateEvent } from "~/events/index.js";
import { AuditLogAfterUpdateEvent } from "~/events/index.js";
import type { AuditLogPayload } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import { UpdateAuditLogUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateAuditLogRepository } from "./abstractions.js";

class UpdateAuditLogUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: UpdateAuditLogRepository.Interface,
        private readonly permissions: AuditLogPermissions.Interface,
        private readonly eventPublisher: EventPublisher.Interface
    ) {}

    public async execute(
        original: IAuditLog,
        payload: Partial<AuditLogPayload>
    ): Promise<Result<IAuditLog, UseCaseAbstraction.Error>> {
        let content = original.content;
        if (payload.content) {
            content = JSON.stringify(payload.content);
        }

        const auditLog: IAuditLog = {
            ...original,
            ...payload,
            content
        };

        const canAccess = await this.permissions.canAccess(auditLog.action);
        if (!canAccess) {
            return Result.fail(
                new NotAuthorizedError({ message: "You cannot access audit logs." })
            );
        }

        const beforeUpdateEvent = new AuditLogBeforeUpdateEvent({
            original,
            auditLog,
            setAuditLog(input) {
                Object.assign(auditLog, input);
            }
        });
        await this.eventPublisher.publish(beforeUpdateEvent);

        const result = await this.repository.update(auditLog);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const afterUpdateEvent = new AuditLogAfterUpdateEvent({ original, auditLog });
        await this.eventPublisher.publish(afterUpdateEvent);

        return Result.ok(result.value);
    }
}

export const UpdateAuditLogUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateAuditLogUseCaseImpl,
    dependencies: [UpdateAuditLogRepository, AuditLogPermissions, EventPublisher]
});
