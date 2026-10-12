import { Result } from "@webiny/feature/api";
import type { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type { BoundWorkflow } from "~/domain/errors.js";
import { toCmsNamespace } from "~/utils/appName.js";

/** v1 binds one workflow per model (D15); a few extra cover the accepted save race (D41). */
const BOUND_WORKFLOWS_LIMIT = 10;

/** The workflows bound to a CMS model, for the model delete guards (R64). */
export const listBoundWorkflows = async (
    listWorkflows: ListWorkflowsUseCase.Interface,
    modelId: string
): Promise<Result<BoundWorkflow[], WorkflowPersistenceError>> => {
    const workflows = await listWorkflows.execute({
        where: { models_in: [toCmsNamespace(modelId)] },
        limit: BOUND_WORKFLOWS_LIMIT
    });
    if (workflows.isFail()) {
        return Result.fail(workflows.error);
    }
    return Result.ok(
        workflows.value.items.map(workflow => {
            return { id: workflow.id, name: workflow.name };
        })
    );
};
