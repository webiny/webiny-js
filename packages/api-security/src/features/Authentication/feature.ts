import { createFeature } from "@webiny/feature";
import { AuthenticationService } from "./AuthenticationService";
import * as abstractions from "./abstractions";
import type { SecurityContext } from "~/types.js";

export const AuthenticationFeature = createFeature<SecurityContext>({
    name: "Authentication",
    register(container, context) {
        container.registerInstance(
            abstractions.AuthenticationService,
            new AuthenticationService(context!.security)
        );
    }
});
