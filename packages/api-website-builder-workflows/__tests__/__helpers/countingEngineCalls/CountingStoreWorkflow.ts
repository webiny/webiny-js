import type { Container } from "@webiny/di";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingStoreWorkflow implements StoreWorkflowUseCase.Interface {
    public constructor(private decoratee: StoreWorkflowUseCase.Interface) {}

    public async execute(input: StoreWorkflowUseCase.Input): StoreWorkflowUseCase.Return {
        engineCalls.push("StoreWorkflow");
        return this.decoratee.execute(input);
    }
}

/** Records every `StoreWorkflowUseCase` call in `engineCalls` as "StoreWorkflow". */
export const countStoreWorkflowCalls = (container: Container): void => {
    container.registerDecorator(
        StoreWorkflowUseCase.createDecorator({ decorator: CountingStoreWorkflow, dependencies: [] })
    );
};
