import type { OpenSearchContext } from "@webiny/api-opensearch/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { Context as TasksContext } from "@webiny/tasks/types.js";

export type * from "./tasks/MockDataManager/types.js";

export interface Context extends CmsContext, OpenSearchContext, TasksContext {}
