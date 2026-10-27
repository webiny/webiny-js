import { Result } from "@webiny/feature/api";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { GetBoundWorkflowUseCase as UseCase } from "./abstractions.js";

class GetBoundWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(private listWorkflows: ListWorkflowsUseCase.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const listed = await this.listWorkflows.execute({
            where: { models_in: [input.model] },
            limit: 1
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }
        return Result.ok(listed.value.items[0] ?? null);
    }
}

export const GetBoundWorkflowUseCase = UseCase.createImplementation({
    implementation: GetBoundWorkflowUseCaseImpl,
    dependencies: [ListWorkflowsUseCase]
});
