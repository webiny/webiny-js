import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import { isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { ListCmsEntryWorkflowsUseCase as UseCase } from "./abstractions.js";

const PAGE_SIZE = 100;

/**
 * The CMS where-filters cannot express "every `cms.*` model", so this pages through every
 * workflow and keeps the Headless CMS ones (R59).
 */
class ListCmsEntryWorkflowsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listWorkflows: ListWorkflowsUseCase.Interface
    ) {}

    public async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const workflows: Workflow[] = [];
        const seenCursors = new Set<string>();
        let after: string | null = null;
        do {
            const page: Awaited<ListWorkflowsUseCase.Return> = await this.listWorkflows.execute({
                limit: PAGE_SIZE,
                after
            });
            if (page.isFail()) {
                return Result.fail(page.error);
            }
            workflows.push(...page.value.items.filter(isCmsWorkflow));
            after = page.value.meta.hasMoreItems ? page.value.meta.cursor : null;
            // Defensive: stop when the engine returns a cursor it returned before.
            if (after) {
                if (seenCursors.has(after)) {
                    break;
                }
                seenCursors.add(after);
            }
        } while (after);

        return Result.ok(workflows);
    }
}

export const ListCmsEntryWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryWorkflowsUseCaseImpl,
    dependencies: [CurrentReviewViewer, ListWorkflowsUseCase]
});
