import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WcpContext } from "@webiny/api-wcp/types.js";
import type { Context as TasksContext } from "@webiny/tasks/types.js";
import type { IWorkflowsContext } from "~/context/abstractions/WorkflowsContext.js";
import type { IWorkflowsStateContext } from "~/context/abstractions/WorkflowsStateContext.js";


export interface Context extends CmsContext, TasksContext, Pick<WcpContext, "wcp"> {
    workflows: IWorkflowsContext;
    workflowState: IWorkflowsStateContext;
}
