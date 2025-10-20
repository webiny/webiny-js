import { createFeature } from "@webiny/feature/api";
import { AuthenticationService } from "./AuthenticationService.js";
import * as abstractions from "./abstractions.js";
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
