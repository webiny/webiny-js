import { createFeature } from "@webiny/feature/admin";
import { AuthenticationContextFeature } from "./AuthenticationContext/feature.js";
import { IdentityContextFeature } from "./IdentityContext/feature.js";
import { LogInFeature } from "./LogIn/feature.js";
import { LogOutFeature } from "./LogOut/feature.js";

export const SecurityFeature = createFeature({
    name: "Security",
    register(container) {
        AuthenticationContextFeature.register(container);
        IdentityContextFeature.register(container);
        LogInFeature.register(container);
        LogOutFeature.register(container);
    }
});
