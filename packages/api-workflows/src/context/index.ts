import type { Context } from "~/types.js";
import { WorkflowsContext } from "./WorkflowsContext";
import { WorkflowsTransformer } from "~/context/transformer/index.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

export const createContext = async (context: Context) => {
    const model = await context.cms.getModel(WORKFLOW_MODEL_ID);

    context.workflows = new WorkflowsContext({
        context,
        model,
        transformer: new WorkflowsTransformer()
    });
};
