import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";

class RepeatingCursorListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(input?: ListWorkflowsUseCase.Input): ListWorkflowsUseCase.Return {
        const page = await this.decoratee.execute(input);
        if (page.isFail()) {
            return page;
        }
        return Result.ok({
            ...page.value,
            meta: { ...page.value.meta, hasMoreItems: true, cursor: "same-cursor" }
        });
    }
}

/** Every workflow list page claims more items behind the same cursor (`legacyPlugins`). */
export const repeatListWorkflowsCursor = (container: Container) => {
    container.registerDecorator(
        ListWorkflowsUseCase.createDecorator({
            decorator: RepeatingCursorListWorkflows,
            dependencies: []
        })
    );
};
