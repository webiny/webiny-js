import { Result } from "@webiny/feature/api";
import { GetWorkflowUseCase } from "../GetWorkflow/index.js";
import { CreateWorkflowUseCase } from "../CreateWorkflow/index.js";
import { UpdateWorkflowUseCase } from "../UpdateWorkflow/index.js";
import { StoreWorkflowUseCase as UseCase } from "./abstractions.js";

class StoreWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private getWorkflow: GetWorkflowUseCase.Interface,
        private createWorkflow: CreateWorkflowUseCase.Interface,
        private updateWorkflow: UpdateWorkflowUseCase.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const existingResult = await this.getWorkflow.execute({
            app: input.app,
            id: input.id
        });

        // If getWorkflow fails with anything other than NotFound, propagate error
        if (existingResult.isFail()) {
            if (existingResult.error.code !== "Workflows/Workflow/NotFound") {
                return Result.fail(existingResult.error);
            }
        }

        const existing = existingResult.isOk() ? existingResult.value : null;

        if (!existing) {
            return this.createWorkflow.execute(input);
        } else {
            return this.updateWorkflow.execute(input, existing);
        }
    }
}

export const StoreWorkflowUseCase = UseCase.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [GetWorkflowUseCase, CreateWorkflowUseCase, UpdateWorkflowUseCase]
});
