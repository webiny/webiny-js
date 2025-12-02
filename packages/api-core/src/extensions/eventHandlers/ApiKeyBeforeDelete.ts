import { defineApiExtension } from "@webiny/project/defineExtension";
import { ApiKeyBeforeDeleteHandler } from "~/features/security/apiKeys/DeleteApiKey/index.js";

export const ApiKeyBeforeDelete = defineApiExtension({
    type: "Security/ApiKeyBeforeDelete",
    description: "Add custom logic to be executed before an API key is deleted.",
    abstraction: ApiKeyBeforeDeleteHandler
});
