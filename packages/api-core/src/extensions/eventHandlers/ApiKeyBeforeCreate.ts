import { defineApiExtension } from "@webiny/project/defineExtension";
import { ApiKeyBeforeCreateHandler } from "~/features/security/apiKeys/CreateApiKey/index.js";

export const ApiKeyBeforeCreate = defineApiExtension({
    type: "Security/ApiKeyBeforeCreate",
    description: "Add custom logic to be executed before an API key is created.",
    abstraction: ApiKeyBeforeCreateHandler
});
