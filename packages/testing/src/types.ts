import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { Context as TasksContext } from "@webiny/tasks/types.js";
import type { WcpContext } from "@webiny/api-wcp/types.js";

export interface Context extends CmsContext, TasksContext, WcpContext {
    //
}
