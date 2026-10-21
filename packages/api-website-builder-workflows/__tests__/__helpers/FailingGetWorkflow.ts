import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

class FailingGetWorkflow implements GetWorkflowUseCase.Interface {
    public constructor(private decoratee: GetWorkflowUseCase.Interface) {}

    public async execute(): GetWorkflowUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

/** Every workflow lookup fails (`legacyPlugins`). */
export const failGetWorkflow = (container: Container) => {
    container.registerDecorator(
        GetWorkflowUseCase.createDecorator({ decorator: FailingGetWorkflow, dependencies: [] })
    );
};
