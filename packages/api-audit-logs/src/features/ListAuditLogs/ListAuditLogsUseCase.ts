import type { Result } from "@webiny/feature/api";
import type { AuditLogPersistenceError } from "~/domain/errors.js";
import type { IListAuditLogsParams } from "~/types.js";
import { ListAuditLogsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAuditLogsRepository } from "./abstractions.js";

class ListAuditLogsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private readonly repository: ListAuditLogsRepository.Interface) {}

    public async execute(
        params: IListAuditLogsParams
    ): Promise<Result<UseCaseAbstraction.Output, AuditLogPersistenceError>> {
        return await this.repository.list(params);
    }
}

export const ListAuditLogsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAuditLogsUseCaseImpl,
    dependencies: [ListAuditLogsRepository]
});
