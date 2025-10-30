import { ApiKeyAfterCreateHandler } from "@webiny/api-core/features/CreateApiKey";
import { ApiKeyAfterUpdateHandler } from "@webiny/api-core/features/UpdateApiKey";
import { ApiKeyAfterDeleteHandler } from "@webiny/api-core/features/DeleteApiKey";
import { AuditLogApiKeyAfterCreateHandler } from "./handlers/AuditLogApiKeyAfterCreateHandler.js";
import { AuditLogApiKeyAfterUpdateHandler } from "./handlers/AuditLogApiKeyAfterUpdateHandler.js";
import { AuditLogApiKeyAfterDeleteHandler } from "./handlers/AuditLogApiKeyAfterDeleteHandler.js";
import type { AuditLogsContext } from "~/types.js";

export const createApiKeyHooks = (context: AuditLogsContext) => {
    context.container.registerFactory(
        ApiKeyAfterCreateHandler,
        () => new AuditLogApiKeyAfterCreateHandler(context)
    );

    context.container.registerFactory(
        ApiKeyAfterUpdateHandler,
        () => new AuditLogApiKeyAfterUpdateHandler(context)
    );

    context.container.registerFactory(
        ApiKeyAfterDeleteHandler,
        () => new AuditLogApiKeyAfterDeleteHandler(context)
    );
};
