import { WorkflowStateContext } from "~/context/WorkflowStateContext.js";
import { WorkflowStateTransformer } from "~/context/transformer/WorkflowStateTransformer.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { WorkflowsContext } from "~/context/WorkflowsContext.js";
import { WorkflowsTransformer } from "~/context/transformer/WorkflowsTransformer";
import type { UseContextHandlerParams } from "@webiny/testing";

export const createContext = async (params?: UseContextHandlerParams) => {
    const { context, stateModel, workflowModel } = await createContextHandler(params);
    const workflowStateContext = new WorkflowStateContext({
        context,
        model: stateModel,
        transformer: new WorkflowStateTransformer()
    });
    const workflowsContext = new WorkflowsContext({
        context,
        model: workflowModel,
        transformer: new WorkflowsTransformer()
    });
    return {
        context,
        stateModel,
        workflowModel,
        workflowStateContext,
        workflowsContext
    };
};
