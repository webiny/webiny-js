import { defineApiExtension } from "@webiny/project/defineExtension";
import { ApiKeyAfterDeleteHandler } from "~/features/security/apiKeys/DeleteApiKey/index.js";

export const ApiKeyAfterDelete = defineApiExtension({
    type: "Security/ApiKeyAfterDelete",
    description: "Add custom logic to be executed after an API key is deleted.",
    abstraction: ApiKeyAfterDeleteHandler
});
