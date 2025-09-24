import { onSettingsAfterUpdateHook } from "./settings";

import type { AuditLogsContext } from "~/types";

export const createMailerHooks = (context: AuditLogsContext) => {
    onSettingsAfterUpdateHook(context);
};
