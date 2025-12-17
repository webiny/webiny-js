import { FolderAfterCreateHandler } from "@webiny/api-aco/features/folder/CreateFolder";
import { FolderAfterUpdateHandler } from "@webiny/api-aco/features/folder/UpdateFolder";
import { FolderAfterDeleteHandler } from "@webiny/api-aco/features/folder/DeleteFolder";

import { AuditLogFolderAfterCreateHandler } from "./handlers/AuditLogFolderAfterCreateHandler.js";
import { AuditLogFolderAfterUpdateHandler } from "./handlers/AuditLogFolderAfterUpdateHandler.js";
import { AuditLogFolderAfterDeleteHandler } from "./handlers/AuditLogFolderAfterDeleteHandler.js";
import type { AuditLogsContext } from "~/types.js";

export const createAcoHooks = (context: AuditLogsContext) => {
    context.container.registerFactory(
        FolderAfterCreateHandler,
        () => new AuditLogFolderAfterCreateHandler(context)
    );

    context.container.registerFactory(
        FolderAfterUpdateHandler,
        () => new AuditLogFolderAfterUpdateHandler(context)
    );

    context.container.registerFactory(
        FolderAfterDeleteHandler,
        () => new AuditLogFolderAfterDeleteHandler(context)
    );
};
