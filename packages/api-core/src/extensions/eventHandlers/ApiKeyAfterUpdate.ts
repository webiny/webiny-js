import { defineApiExtension } from "@webiny/project/defineExtension";
import { ApiKeyAfterUpdateHandler } from "~/features/security/apiKeys/UpdateApiKey/index.js";

export const ApiKeyAfterUpdate = defineApiExtension({
    type: "Security/ApiKeyAfterUpdate",
    description: "Add custom logic to be executed after an API key is updated.",
    abstraction: ApiKeyAfterUpdateHandler
});
