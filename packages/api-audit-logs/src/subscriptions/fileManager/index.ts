import { onFileAfterCreateHook, onFileAfterUpdateHook, onFileAfterDeleteHook } from "./files";
import { onSettingsAfterUpdateHook } from "./settings";

import type { AuditLogsContext } from "~/types";

export const createFileManagerHooks = (context: AuditLogsContext) => {
    onFileAfterCreateHook(context);
    onFileAfterUpdateHook(context);
    onFileAfterDeleteHook(context);
    onSettingsAfterUpdateHook(context);
};
