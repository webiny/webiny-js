import { defineApiExtension } from "@webiny/project/defineExtension";
import { ApiKeyAfterCreateHandler } from "~/features/security/apiKeys/CreateApiKey/index.js";

export const ApiKeyAfterCreate = defineApiExtension({
    type: "Security/ApiKeyAfterCreate",
    description: "Add custom logic to be executed after an API key is created.",
    abstraction: ApiKeyAfterCreateHandler
});
