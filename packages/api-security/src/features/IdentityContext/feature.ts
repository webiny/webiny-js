import { createFeature } from "@webiny/feature/api";
import { IdentityContext } from "./IdentityContext";
import * as abstractions from "./abstractions";
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
