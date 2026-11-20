import { createFeature } from "@webiny/feature/admin";
import { LoginTenantResolver as LoginTenantResolverAbstraction } from "./abstractions.js";
import { LoginTenantResolver } from "./LoginTenantResolver.js";

export const LoginTenantResolverFeature = createFeature({
    name: "LoginTenantResolver",
    register(container) {
        container.register(LoginTenantResolver).inSingletonScope();
    },
    resolve(container) {
        return {
            resolver: container.resolve(LoginTenantResolverAbstraction)
        };
    }
});
