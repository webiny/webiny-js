import { UserAfterCreateHandler } from "@webiny/api-core/features/CreateUser";
import { UserAfterUpdateHandler } from "@webiny/api-core/features/UpdateUser";
import { UserAfterDeleteHandler } from "@webiny/api-core/features/DeleteUser";
import { AuditLogUserAfterCreateHandler } from "./handlers/AuditLogUserAfterCreateHandler.js";
import { AuditLogUserAfterUpdateHandler } from "./handlers/AuditLogUserAfterUpdateHandler.js";
import { AuditLogUserAfterDeleteHandler } from "./handlers/AuditLogUserAfterDeleteHandler.js";
import type { AuditLogsContext } from "~/types.js";

export const createUserHooks = (context: AuditLogsContext) => {
    context.container.registerFactory(
        UserAfterCreateHandler,
        () => new AuditLogUserAfterCreateHandler(context)
    );

    context.container.registerFactory(
        UserAfterUpdateHandler,
        () => new AuditLogUserAfterUpdateHandler(context)
    );

    context.container.registerFactory(
        UserAfterDeleteHandler,
        () => new AuditLogUserAfterDeleteHandler(context)
    );
};
