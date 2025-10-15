import type { Context } from "~/types.js";
import { WorkflowsContext } from "./WorkflowsContext.js";
import { WorkflowsTransformer } from "~/context/transformer/WorkflowsTransformer.js";
import { STATE_MODEL_ID, WORKFLOW_MODEL_ID } from "~/constants.js";
import { WorkflowStateContext } from "./WorkflowStateContext.js";
import { WorkflowStateTransformer } from "./transformer/WorkflowStateTransformer.js";

export const createContext = async (
    context: Pick<Context, "cms" | "security" | "workflows" | "workflowState">
) => {
    const workflowModel = await context.cms.getModel(WORKFLOW_MODEL_ID);
    const stateModel = await context.cms.getModel(STATE_MODEL_ID);

    context.workflows = new WorkflowsContext({
        context,
        model: workflowModel,
        transformer: new WorkflowsTransformer()
    });

    context.workflowState = new WorkflowStateContext({
        context,
        model: stateModel,
        transformer: new WorkflowStateTransformer()
    });
};
