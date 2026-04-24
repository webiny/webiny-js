import { createFeature } from "@webiny/feature/api";
import { MoveRedirectRepository } from "./MoveRedirectRepository.js";
import { MoveRedirectUseCase } from "./MoveRedirectUseCase.js";

export const MoveRedirectFeature = createFeature({
    name: "WebsiteBuilder/MoveRedirect",
    register(container) {
        container.register(MoveRedirectRepository).inSingletonScope();
        container.register(MoveRedirectUseCase);
    }
});
