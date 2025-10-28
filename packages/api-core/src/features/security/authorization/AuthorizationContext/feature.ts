import { createFeature } from "@webiny/feature/api";
import { AuthorizationContext } from "./AuthorizationContext.js";

export const AuthorizationContextFeature = createFeature({
    name: "AuthorizationContext",
    register(container) {
        container.register(AuthorizationContext).inSingletonScope();
    }
});
