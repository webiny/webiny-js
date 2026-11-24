import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { AuditLogPermissions } from "~/features/AuditLogPermissions/abstractions.js";
import type { IAuditLog } from "~/storage/types.js";
import { GetAuditLogUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetAuditLogRepository } from "./abstractions.js";

class GetAuditLogUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: GetAuditLogRepository.Interface,
        private readonly permissions: AuditLogPermissions.Interface
    ) {}

    public async execute(id: string): Promise<Result<IAuditLog, UseCaseAbstraction.Error>> {
        // Checked before the record is loaded, so the response does not reveal whether the ID exists.
        if (!(await this.permissions.canAccessAll())) {
            return Result.fail(
                new NotAuthorizedError({ message: "You cannot access audit logs." })
            );
        }

        const result = await this.repository.get(id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const canAccess = await this.permissions.canAccess(result.value.action);
        if (!canAccess) {
            return Result.fail(
                new NotAuthorizedError({ message: "You cannot access audit logs." })
            );
        }

        return Result.ok(result.value);
    }
}

export const GetAuditLogUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetAuditLogUseCaseImpl,
    dependencies: [GetAuditLogRepository, AuditLogPermissions]
});
