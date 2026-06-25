import type { HcmsBulkActionsContext } from "@webiny/api-headless-cms-bulk-actions/types.js";
import type { AcoContext } from "@webiny/api-aco/types.js";

export interface HcmsTasksContext extends HcmsBulkActionsContext, AcoContext {}
