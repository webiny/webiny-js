import { GroupAfterCreateHandler } from "@webiny/api-core/features/CreateGroup";
import { GroupAfterUpdateHandler } from "@webiny/api-core/features/UpdateGroup";
import { GroupAfterDeleteHandler } from "@webiny/api-core/features/DeleteGroup";
import { AuditLogGroupAfterCreateHandler } from "./handlers/AuditLogGroupAfterCreateHandler.js";
import { AuditLogGroupAfterUpdateHandler } from "./handlers/AuditLogGroupAfterUpdateHandler.js";
import { AuditLogGroupAfterDeleteHandler } from "./handlers/AuditLogGroupAfterDeleteHandler.js";
import type { AuditLogsContext } from "~/types.js";

export const createRoleHooks = (context: AuditLogsContext) => {
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
