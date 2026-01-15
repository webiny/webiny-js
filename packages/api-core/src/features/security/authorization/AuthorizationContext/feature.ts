import { createFeature } from "@webiny/feature/api";
import { AuthorizationContext } from "./AuthorizationContext.js";
import { AuthorizationContext as Abstraction } from "./abstractions.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";

export const AuthorizationContextFeature = createFeature({
    name: "AuthorizationContext",
    register(container) {
        const authorizationContext = new AuthorizationContext(() => {
            return container.resolveAll(Authorizer);
        });

        container.registerInstance(Abstraction, authorizationContext);
    }
});
