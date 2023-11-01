import { onModelAfterCreateHook, onModelAfterDeleteHook, onModelAfterUpdateHook } from "./models";
import { onGroupAfterCreateHook, onGroupAfterDeleteHook, onGroupAfterUpdateHook } from "./groups";
import {
    onEntryAfterCreateHook,
    onEntryAfterUpdateHook,
    onEntryAfterDeleteHook,
    onEntryAfterPublishHook,
    onEntryAfterUnpublishHook,
    onEntryRevisionAfterCreateHook,
    onEntryRevisionAfterDeleteHook
} from "./entries";
import { AuditLogsContext } from "~/types";

export const createHeadlessCmsHooks = (context: AuditLogsContext) => {
    // groups
    onGroupAfterCreateHook(context);
    onGroupAfterUpdateHook(context);
    onGroupAfterDeleteHook(context);
    // models
    onModelAfterCreateHook(context);
    onModelAfterUpdateHook(context);
    onModelAfterDeleteHook(context);
    // entries
    onEntryAfterCreateHook(context);
    onEntryAfterUpdateHook(context);
    onEntryAfterDeleteHook(context);
    onEntryAfterPublishHook(context);
    onEntryAfterUnpublishHook(context);
    onEntryRevisionAfterCreateHook(context);
    onEntryRevisionAfterDeleteHook(context);
};
