import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { ListWorkflowsUseCase as UseCase } from "./abstractions.js";

class ListWorkflowsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowRepository.Interface) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        return this.repository.list({
            where: input.where,
            limit: input.limit,
            after: input.after
        });
    }
}

export const ListWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowsUseCaseImpl,
    dependencies: [WorkflowRepository]
});
