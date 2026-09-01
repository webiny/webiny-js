import {
    ListAuditLogsRepository,
    ListAuditLogsUseCase as UseCaseAbstraction
} from "./abstractions/index.js";

class ListAuditLogsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly repository: ListAuditLogsRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<UseCaseAbstraction.Result> {
        const result = await this.repository.execute(params);
        return result;
    }
}

export const ListAuditLogsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAuditLogsUseCaseImpl,
    dependencies: [ListAuditLogsRepository]
});
