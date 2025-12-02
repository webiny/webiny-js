import { defineApiExtension } from "@webiny/project/defineExtension";
import { ApiKeyBeforeUpdateHandler } from "~/features/security/apiKeys/UpdateApiKey/index.js";

export const ApiKeyBeforeUpdate = defineApiExtension({
    type: "Security/ApiKeyBeforeUpdate",
    description: "Add custom logic to be executed before an API key is updated.",
    abstraction: ApiKeyBeforeUpdateHandler
});
