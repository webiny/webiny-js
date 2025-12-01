import { defineApiExtension } from "@webiny/project/defineExtension";
import { BeforeAuthenticationHandler } from "~/features/security/authentication/AuthenticationContext/index.js";

export const BeforeAuthentication = defineApiExtension({
    type: "Security/BeforeAuthentication",
    description: "Add custom logic to be executed before authentication.",
    abstraction: BeforeAuthenticationHandler
});
