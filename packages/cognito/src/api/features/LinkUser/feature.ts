import { createFeature } from "@webiny/feature/api";
import { LinkUserUseCase } from "./LinkUserUseCase.js";

export const LinkUserFeature = createFeature({
    name: "LinkUserFeature",
    register(container) {
        container.register(LinkUserUseCase);
    }
});
