import { createFeature } from "@webiny/feature/admin";
import { IdentityContext as IdentityContextAbstraction } from "./abstractions.js";
import { IdentityContext } from "./IdentityContext.js";

export const IdentityContextFeature = createFeature({
    name: "IdentityContext",
    register(container) {
        container.register(IdentityContext).inSingletonScope();
    },
    resolve(container) {
        return {
            identityContext: container.resolve(IdentityContextAbstraction)
        };
    }
});
