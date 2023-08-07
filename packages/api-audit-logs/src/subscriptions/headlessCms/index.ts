import { onModelAfterCreateHook, onModelAfterUpdateHook, onModelAfterDeleteHook } from "./models";
import { onGroupAfterCreateHook, onGroupAfterUpdateHook, onGroupAfterDeleteHook } from "./groups";
import {
    // onEntryAfterCreateHook,
    onEntryAfterDeleteHook
} from "./entries";
import {
    onEntryRevisionAfterCreateHook,
    onEntryRevisionAfterUpdateHook,
    onEntryRevisionAfterDeleteHook,
    onEntryRevisionAfterPublishHook,
    onEntryRevisionAfterUnpublishHook
} from "./entryRevisions";

import { AuditLogsContext } from "~/types";

export const createHeadlessCmsHooks = (context: AuditLogsContext) => {
    onModelAfterCreateHook(context);
    onModelAfterUpdateHook(context);
    onModelAfterDeleteHook(context);
    onGroupAfterCreateHook(context);
    onGroupAfterUpdateHook(context);
    onGroupAfterDeleteHook(context);
    // onEntryAfterCreateHook(context); Create loops, since ACO uses Headless CMS to store entries
    onEntryAfterDeleteHook(context);
    onEntryRevisionAfterCreateHook(context);
    onEntryRevisionAfterUpdateHook(context);
    onEntryRevisionAfterDeleteHook(context);
    onEntryRevisionAfterPublishHook(context);
    onEntryRevisionAfterUnpublishHook(context);
};
