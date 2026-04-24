import { createFeature } from "@webiny/feature/api";
import { AuthorizationContext } from "./AuthorizationContext.js";
import { AuthorizationContext as Abstraction, PermissionTransformer } from "./abstractions.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";

export const AuthorizationContextFeature = createFeature({
    name: "AuthorizationContext",
    register(container) {
        const getAuthorizers = () => container.resolveAll(Authorizer);
        const getTransformers = () => container.resolveAll(PermissionTransformer);

        const authorizationContext = new AuthorizationContext(getAuthorizers, getTransformers);

        container.registerInstance(Abstraction, authorizationContext);
    }
});
