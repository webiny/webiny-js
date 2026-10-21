import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";

const REPEATED_CURSOR = "same-cursor";

class RepeatingCursorListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(input?: ListWorkflowsUseCase.Input): ListWorkflowsUseCase.Return {
        const page = await this.decoratee.execute(input);
        if (page.isFail()) {
            return page;
        }
        // The repeated cursor leads to an empty page that claims more items behind the same cursor.
        const items = input?.after === REPEATED_CURSOR ? [] : page.value.items;
        return Result.ok({
            ...page.value,
            items,
            meta: { ...page.value.meta, hasMoreItems: true, cursor: REPEATED_CURSOR }
        });
    }
}

/** Every workflow list page claims more items behind the same cursor; the repeat is empty (`legacyPlugins`). */
export const repeatListWorkflowsCursor = (container: Container) => {
    container.registerDecorator(
        ListWorkflowsUseCase.createDecorator({
            decorator: RepeatingCursorListWorkflows,
            dependencies: []
        })
    );
};
