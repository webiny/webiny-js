import type { Container } from "@webiny/di";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingDeleteWorkflow implements DeleteWorkflowUseCase.Interface {
    public constructor(private decoratee: DeleteWorkflowUseCase.Interface) {}

    public async execute(input: DeleteWorkflowUseCase.Input): DeleteWorkflowUseCase.Return {
        engineCalls.push("DeleteWorkflow");
        return this.decoratee.execute(input);
    }
}

/** Records every `DeleteWorkflowUseCase` call in `engineCalls` as "DeleteWorkflow". */
export const countDeleteWorkflowCalls = (container: Container): void => {
    container.registerDecorator(
        DeleteWorkflowUseCase.createDecorator({
            decorator: CountingDeleteWorkflow,
            dependencies: []
        })
    );
};
