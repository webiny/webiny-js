import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";

/**
 * The workflow bound to a review namespace, or `null` for an unbound model. The rules ask this
 * first, so unbound models never look up reviews (D134, R54). A failed lookup is thrown, so the
 * guarded action is refused (fail closed, A38).
 */
export const findBoundWorkflow = async (
    getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
    model: string
): Promise<Workflow | null> => {
    const bound = await getBoundWorkflow.execute({ model });
    if (bound.isFail()) {
        throw bound.error;
    }
    return bound.value;
};
