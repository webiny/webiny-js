import { Result } from "@webiny/feature/api";
import { ListWorkflowsRepository, ListWorkflowsUseCase as UseCase } from "./abstractions.js";

class ListWorkflowsUseCaseImpl implements UseCase.Interface {
    private readonly repository: ListWorkflowsRepository.Interface;

    constructor(repository: ListWorkflowsRepository.Interface) {
        this.repository = repository;
    }

    async execute(input: UseCase.Params): UseCase.Return {
        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }
}

export const ListWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowsUseCaseImpl,
    dependencies: [ListWorkflowsRepository]
});
