import { createFeature } from "@webiny/feature/api";
import { AuthorizationContext } from "./AuthorizationContext.js";
import { AuthorizationContext as Abstraction, PermissionTransformer } from "./abstractions.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";

export const AuthorizationContextFeature = createFeature({
    name: "AuthorizationContext",
    register(container) {
        const getAuthorizers = () => container.resolveAll(Authorizer);
        const getTransformers = () => container.resolveAll(PermissionTransformer);
        // Read lazily: the tenant is set after registration, and slim test containers have none.
        const getTenantId = (): string | null => {
            const [tenantContext] = container.resolveAll(TenantContext);
            return tenantContext?.getTenant()?.id ?? null;
        };

        const authorizationContext = new AuthorizationContext(
            getAuthorizers,
            getTransformers,
            getTenantId
        );

        container.registerInstance(Abstraction, authorizationContext);
    }
});
