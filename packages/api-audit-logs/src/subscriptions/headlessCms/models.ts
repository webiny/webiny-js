import { ModelAfterCreateHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/events.js";
import { ModelAfterUpdateHandler } from "@webiny/api-headless-cms/features/contentModel/UpdateModel/events.js";
import { ModelAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import { AuditLogModelAfterCreateHandler } from "./handlers/AuditLogModelAfterCreateHandler.js";
import { AuditLogModelAfterUpdateHandler } from "./handlers/AuditLogModelAfterUpdateHandler.js";
import { AuditLogModelAfterDeleteHandler } from "./handlers/AuditLogModelAfterDeleteHandler.js";
import type { AuditLogsContext } from "~/types.js";

export const createModelHooks = (context: AuditLogsContext) => {
    context.container.registerFactory(
        ModelAfterCreateHandler,
        () => new AuditLogModelAfterCreateHandler(context)
    );

    context.container.registerFactory(
        ModelAfterUpdateHandler,
        () => new AuditLogModelAfterUpdateHandler(context)
    );

    context.container.registerFactory(
        ModelAfterDeleteHandler,
        () => new AuditLogModelAfterDeleteHandler(context)
    );
};
