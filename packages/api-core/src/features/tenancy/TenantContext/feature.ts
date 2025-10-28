import { createFeature } from "@webiny/feature/api";
import { TenantContext } from "./TenantContext.js";

export const TenantContextFeature = createFeature({
    name: "TenantContextFeature",
    register(container) {
        container.register(TenantContext).inSingletonScope();
    }
});
