import { createFeature } from "@webiny/feature/api";
import { TenantLinkAuthorizer } from "./TenantLinkAuthorizer.js";

export const TenantLinkAuthorizerFeature = createFeature({
    name: "TenantLinkAuthorizer",
    register(container) {
        container.register(TenantLinkAuthorizer).inSingletonScope();
    }
});
