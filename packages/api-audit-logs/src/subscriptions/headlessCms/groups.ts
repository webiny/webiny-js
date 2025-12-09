import { GroupAfterCreateHandler } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/events.js";
import { GroupAfterUpdateHandler } from "@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/events.js";
import { GroupAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.js";
import { AuditLogGroupAfterCreateHandler } from "./handlers/AuditLogGroupAfterCreateHandler.js";
import { AuditLogGroupAfterUpdateHandler } from "./handlers/AuditLogGroupAfterUpdateHandler.js";
import { AuditLogGroupAfterDeleteHandler } from "./handlers/AuditLogGroupAfterDeleteHandler.js";
import type { AuditLogsContext } from "~/types.js";

export const createGroupHooks = (context: AuditLogsContext) => {
    context.container.registerFactory(
        GroupAfterCreateHandler,
        () => new AuditLogGroupAfterCreateHandler(context)
    );

    context.container.registerFactory(
        GroupAfterUpdateHandler,
        () => new AuditLogGroupAfterUpdateHandler(context)
    );

    context.container.registerFactory(
        GroupAfterDeleteHandler,
        () => new AuditLogGroupAfterDeleteHandler(context)
    );
};
