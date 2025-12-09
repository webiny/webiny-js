import { createModelHooks } from "./models.js";
import { createGroupHooks } from "./groups.js";
import { createEntryHooks } from "./entries.js";
import type { AuditLogsContext } from "~/types.js";

export const createHeadlessCmsHooks = (context: AuditLogsContext) => {
    createGroupHooks(context);
    createModelHooks(context);
    createEntryHooks(context);
};
