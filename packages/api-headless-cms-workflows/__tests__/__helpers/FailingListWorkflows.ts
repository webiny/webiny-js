import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

class FailingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(): ListWorkflowsUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

/** Every workflow list fails, so the binding and model-delete lookups fail (`legacyPlugins`). */
export const failListWorkflows = (container: Container) => {
    container.registerDecorator(
        ListWorkflowsUseCase.createDecorator({ decorator: FailingListWorkflows, dependencies: [] })
    );
};
