import { EntryAfterCreateHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.js";
import { EntryAfterUpdateHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js";
import { EntryAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js";
import { EntryAfterRestoreFromBinHandler } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js";
import { EntryAfterPublishHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.js";
import { EntryAfterUnpublishHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.js";
import { EntryRevisionAfterCreateHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.js";
import { EntryRevisionAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.js";
import { AuditLogEntryAfterCreateHandler } from "./handlers/AuditLogEntryAfterCreateHandler.js";
import { AuditLogEntryAfterUpdateHandler } from "./handlers/AuditLogEntryAfterUpdateHandler.js";
import { AuditLogEntryAfterDeleteHandler } from "./handlers/AuditLogEntryAfterDeleteHandler.js";
import { AuditLogEntryAfterRestoreFromBinHandler } from "./handlers/AuditLogEntryAfterRestoreFromBinHandler.js";
import { AuditLogEntryAfterPublishHandler } from "./handlers/AuditLogEntryAfterPublishHandler.js";
import { AuditLogEntryAfterUnpublishHandler } from "./handlers/AuditLogEntryAfterUnpublishHandler.js";
import { AuditLogEntryRevisionAfterCreateHandler } from "./handlers/AuditLogEntryRevisionAfterCreateHandler.js";
import { AuditLogEntryRevisionAfterDeleteHandler } from "./handlers/AuditLogEntryRevisionAfterDeleteHandler.js";
import type { AuditLogsContext } from "~/types.js";

export const createEntryHooks = (context: AuditLogsContext) => {
    context.container.registerFactory(
        EntryAfterCreateHandler,
        () => new AuditLogEntryAfterCreateHandler(context)
    );

    context.container.registerFactory(
        EntryAfterUpdateHandler,
        () => new AuditLogEntryAfterUpdateHandler(context)
    );

    context.container.registerFactory(
        EntryAfterDeleteHandler,
        () => new AuditLogEntryAfterDeleteHandler(context)
    );

    context.container.registerFactory(
        EntryAfterRestoreFromBinHandler,
        () => new AuditLogEntryAfterRestoreFromBinHandler(context)
    );

    context.container.registerFactory(
        EntryAfterPublishHandler,
        () => new AuditLogEntryAfterPublishHandler(context)
    );

    context.container.registerFactory(
        EntryAfterUnpublishHandler,
        () => new AuditLogEntryAfterUnpublishHandler(context)
    );

    context.container.registerFactory(
        EntryRevisionAfterCreateHandler,
        () => new AuditLogEntryRevisionAfterCreateHandler(context)
    );

    context.container.registerFactory(
        EntryRevisionAfterDeleteHandler,
        () => new AuditLogEntryRevisionAfterDeleteHandler(context)
    );
};
