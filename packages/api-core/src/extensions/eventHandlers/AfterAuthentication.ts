import { defineApiExtension } from "@webiny/project/defineExtension";
import { AfterAuthenticationHandler } from "~/features/security/authentication/AuthenticationContext/index.js";

export const AfterAuthentication = defineApiExtension({
    type: "Security/AfterAuthentication",
    description: "Add custom logic to be executed after authentication.",
    abstraction: AfterAuthenticationHandler
});
