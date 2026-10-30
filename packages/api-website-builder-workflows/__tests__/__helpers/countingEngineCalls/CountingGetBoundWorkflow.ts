import type { Container } from "@webiny/di";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingGetBoundWorkflow implements GetBoundWorkflowUseCase.Interface {
    public constructor(private decoratee: GetBoundWorkflowUseCase.Interface) {}

    public async execute(input: GetBoundWorkflowUseCase.Input): GetBoundWorkflowUseCase.Return {
        engineCalls.push("GetBoundWorkflow");
        return this.decoratee.execute(input);
    }
}

/** Records every `GetBoundWorkflowUseCase` call in `engineCalls` as "GetBoundWorkflow". */
export const countGetBoundWorkflowCalls = (container: Container): void => {
    container.registerDecorator(
        GetBoundWorkflowUseCase.createDecorator({
            decorator: CountingGetBoundWorkflow,
            dependencies: []
        })
    );
};
