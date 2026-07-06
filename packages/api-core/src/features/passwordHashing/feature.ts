import { createFeature } from "@webiny/feature/api";
import { PasswordHasher } from "./ScryptPasswordHasher.js";

export const PasswordHasherFeature = createFeature({
    name: "PasswordHasherFeature",
    register(container) {
        container.register(PasswordHasher);
    }
});
