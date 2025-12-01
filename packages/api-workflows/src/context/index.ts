import type { Context } from "~/types.js";
import { WorkflowsContext } from "./WorkflowsContext.js";
import { WorkflowsTransformer } from "~/context/transformer/WorkflowsTransformer.js";
import { WORKFLOW_STATE_MODEL_ID, WORKFLOW_MODEL_ID } from "~/constants.js";
import { WorkflowStateContext } from "./WorkflowStateContext.js";
import { WorkflowStateTransformer } from "./transformer/WorkflowStateTransformer.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

export const createContext = async (
    context: Pick<
        Context,
        "container" | "cms" | "security" | "workflows" | "workflowState" | "adminUsers"
    >
) => {
    const identityContext = context.container.resolve(IdentityContext);
    const getModel = context.container.resolve(GetModelUseCase);

    const workflowModel = await identityContext.withoutAuthorization(() => {
        return getModel.execute(WORKFLOW_MODEL_ID);
    });

    const stateModel = await identityContext.withoutAuthorization(() => {
        return getModel.execute(WORKFLOW_STATE_MODEL_ID);
    });

    context.workflows = new WorkflowsContext({
        context,
        model: workflowModel.value,
        transformer: new WorkflowsTransformer()
    });

    context.workflowState = new WorkflowStateContext({
        context,
        model: stateModel.value,
        transformer: new WorkflowStateTransformer()
    });
};
