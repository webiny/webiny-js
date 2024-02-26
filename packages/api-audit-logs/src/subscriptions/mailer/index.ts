import { onSettingsAfterUpdateHook } from "./settings";

import { AuditLogsContext } from "~/types";

export const createMailerHooks = (context: AuditLogsContext) => {
    onSettingsAfterUpdateHook(context);
};
