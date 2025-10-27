import { ApiKeyAfterCreateHandler } from "@webiny/api-security/features/apiKeys/CreateApiKey";
import { ApiKeyAfterUpdateHandler } from "@webiny/api-security/features/apiKeys/UpdateApiKey";
import { ApiKeyAfterDeleteHandler } from "@webiny/api-security/features/apiKeys/DeleteApiKey";
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
