import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { AuditLogPermissions } from "~/features/AuditLogPermissions/abstractions.js";
import type { IListAuditLogsParams } from "~/types.js";
import { ListAuditLogsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAuditLogsRepository } from "./abstractions.js";

class ListAuditLogsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: ListAuditLogsRepository.Interface,
        private readonly permissions: AuditLogPermissions.Interface
    ) {}

    public async execute(
        params: IListAuditLogsParams
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        const canAccess = await this.permissions.canAccessAll();
        if (!canAccess) {
            return Result.fail(
                new NotAuthorizedError({ message: "You cannot access audit logs." })
            );
        }

        return await this.repository.list(params);
    }
}

export const ListAuditLogsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAuditLogsUseCaseImpl,
    dependencies: [ListAuditLogsRepository, AuditLogPermissions]
});
