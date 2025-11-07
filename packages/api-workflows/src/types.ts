import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { Context as TasksContext } from "@webiny/tasks/types.js";
import type { IWorkflowsContext } from "~/context/abstractions/WorkflowsContext.js";
import type { IWorkflowStateContext } from "~/context/abstractions/WorkflowStateContext.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export interface Context extends ApiCoreContext, CmsContext, TasksContext {
    workflows: IWorkflowsContext;
    workflowState: IWorkflowStateContext;
}
