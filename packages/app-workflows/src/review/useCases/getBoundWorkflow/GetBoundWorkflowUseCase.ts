import type { ReviewWorkflow } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetBoundWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetBoundWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewWorkflow | null> {
        const workflows = await this.repository.listWorkflows(params.namespace);
        // The workflow that binds the namespace (R351).
        const workflow = workflows.find(item => item.namespaces.includes(params.namespace));
        return workflow ?? null;
    }
}

export const GetBoundWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetBoundWorkflowUseCaseImpl,
    dependencies: [ReviewRepository]
});
