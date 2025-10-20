import { createFeature } from "@webiny/feature/api";
import { IdentityContext } from "./IdentityContext.js";
import * as abstractions from "./abstractions.js";
import type { SecurityContext } from "~/types.js";

export const IdentityContextFeature = createFeature<SecurityContext>({
    name: "IdentityContext",
    register(container, context) {
        container.registerInstance(
            abstractions.IdentityContext,
            new IdentityContext(context!.security)
        );
    }
});
