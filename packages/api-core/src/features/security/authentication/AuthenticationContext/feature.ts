import { createFeature } from "@webiny/feature/api";
import { AuthenticationContext } from "./AuthenticationContext.js";

export const AuthenticationContextFeature = createFeature({
    name: "AuthenticationContext",
    register(container) {
        container.register(AuthenticationContext).inSingletonScope();
    }
});
