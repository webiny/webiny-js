import { createFeature } from "@webiny/feature/api";
import { IdentityContext } from "./IdentityContext.js";

export const IdentityContextFeature = createFeature({
    name: "IdentityContext",
    register(container) {
        container.register(IdentityContext).inSingletonScope();
    }
});
