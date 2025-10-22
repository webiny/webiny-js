import { createFeature } from "@webiny/feature/api";
import { AuthenticationContext } from "./AuthenticationContext.js";

export const AuthenticationFeature = createFeature({
    name: "Authentication",
    register(container) {
        container.register(AuthenticationContext).inSingletonScope();
    }
});
