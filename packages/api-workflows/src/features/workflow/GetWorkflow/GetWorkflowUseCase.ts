import { Result } from "@webiny/feature/api";
import { GetWorkflowRepository, GetWorkflowUseCase as UseCase } from "./abstractions.js";

class GetWorkflowUseCaseImpl implements UseCase.Interface {
    private readonly repository: GetWorkflowRepository.Interface;

    constructor(repository: GetWorkflowRepository.Interface) {
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

export const GetWorkflowUseCase = UseCase.createImplementation({
    implementation: GetWorkflowUseCaseImpl,
    dependencies: [GetWorkflowRepository]
});
