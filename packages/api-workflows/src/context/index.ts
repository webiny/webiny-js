import type { Context } from "~/types.js";
import { WorkflowsContext } from "./WorkflowsContext.js";
import { WorkflowsTransformer } from "~/context/transformer/WorkflowsTransformer.js";
import { STATE_MODEL_ID, WORKFLOW_MODEL_ID } from "~/constants.js";
import { WorkflowsStateContext } from "~/context/WorkflowsStateContext.js";
import { WorkflowStateTransformer } from "~/context/transformer/WorkflowStateTransformer.js";

export const createContext = async (context: Context) => {
    const workflowModel = await context.cms.getModel(WORKFLOW_MODEL_ID);
    const stateModel = await context.cms.getModel(STATE_MODEL_ID);

    context.workflows = new WorkflowsContext({
        context,
        model: workflowModel,
        transformer: new WorkflowsTransformer()
    });
    
    context.workflowState = new WorkflowsStateContext({
        context,
        model: stateModel,
        transformer: new WorkflowStateTransformer()
    });
    
};
