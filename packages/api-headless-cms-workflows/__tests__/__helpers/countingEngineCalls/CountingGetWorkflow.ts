import type { Container } from "@webiny/di";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingGetWorkflow implements GetWorkflowUseCase.Interface {
    public constructor(private decoratee: GetWorkflowUseCase.Interface) {}

    public async execute(input: GetWorkflowUseCase.Input): GetWorkflowUseCase.Return {
        engineCalls.push("GetWorkflow");
        return this.decoratee.execute(input);
    }
}

/** Records every `GetWorkflowUseCase` call in `engineCalls` as "GetWorkflow". */
export const countGetWorkflowCalls = (container: Container): void => {
    container.registerDecorator(
        GetWorkflowUseCase.createDecorator({ decorator: CountingGetWorkflow, dependencies: [] })
    );
};
