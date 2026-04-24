import { createFeature } from "@webiny/feature/api";
import { KickOutCurrentUserUseCase } from "./KickOutCurrentUserUseCase.js";

export const KickOutCurrentUserFeature = createFeature({
    name: "KickOutCurrentUser",
    register(container) {
        container.register(KickOutCurrentUserUseCase);
    }
});
