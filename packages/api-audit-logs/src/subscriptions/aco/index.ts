import {
    onFolderAfterCreateHook,
    onFolderAfterUpdateHook,
    onFolderAfterDeleteHook
} from "./folders";

import { AuditLogsContext } from "~/types";

export const createAcoHooks = (context: AuditLogsContext) => {
    if (!context.aco) {
        return;
    }

    onFolderAfterCreateHook(context);
    onFolderAfterUpdateHook(context);
    onFolderAfterDeleteHook(context);
};
