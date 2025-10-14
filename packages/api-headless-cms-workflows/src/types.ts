import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { Context as WorkflowsContext } from "@webiny/api-workflows/types.js";

export interface Context extends CmsContext, WorkflowsContext {
    //
}
