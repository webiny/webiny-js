import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

class FailingGetBoundWorkflow implements GetBoundWorkflowUseCase.Interface {
    public constructor(private decoratee: GetBoundWorkflowUseCase.Interface) {}

    public async execute(): GetBoundWorkflowUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

/** Every bound workflow lookup fails (`legacyPlugins`). */
export const failGetBoundWorkflow = (container: Container) => {
    container.registerDecorator(
        GetBoundWorkflowUseCase.createDecorator({
            decorator: FailingGetBoundWorkflow,
            dependencies: []
        })
    );
};
