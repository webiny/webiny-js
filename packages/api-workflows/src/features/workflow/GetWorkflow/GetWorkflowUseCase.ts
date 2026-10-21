import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { GetWorkflowUseCase as UseCase } from "./abstractions.js";

class GetWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.get(input.id);
    }
}

export const GetWorkflowUseCase = UseCase.createImplementation({
    implementation: GetWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository]
});
