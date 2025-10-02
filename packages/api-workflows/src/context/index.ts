import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { WorkflowsContext } from "./WorkflowsContext";
import { WORKFLOW_MODEL_ID } from "~/context/model.js";
import { WorkflowsTransformer } from "~/context/transformer/index.js";

export const createContext = () => {
    return new ContextPlugin<Context>(async context => {
        const model = await context.cms.getModel(WORKFLOW_MODEL_ID);

        context.workflows = new WorkflowsContext({
            context,
            model,
            transformer: new WorkflowsTransformer()
        });
    });
};
