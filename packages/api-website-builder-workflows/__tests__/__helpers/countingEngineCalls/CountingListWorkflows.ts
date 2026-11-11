import type { Container } from "@webiny/di";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(input?: ListWorkflowsUseCase.Input): ListWorkflowsUseCase.Return {
        engineCalls.push("ListWorkflows");
        return this.decoratee.execute(input);
    }
}

/** Records every `ListWorkflowsUseCase` call in `engineCalls` as "ListWorkflows". */
export const countListWorkflowsCalls = (container: Container): void => {
    container.registerDecorator(
        ListWorkflowsUseCase.createDecorator({ decorator: CountingListWorkflows, dependencies: [] })
    );
};
