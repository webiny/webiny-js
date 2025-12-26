import { createFeature } from "@webiny/feature/api";
import { DeleteRedirectRepository } from "./DeleteRedirectRepository.js";
import { DeleteRedirectUseCase } from "./DeleteRedirectUseCase.js";

export const DeleteRedirectFeature = createFeature({
    name: "WebsiteBuilder/DeleteRedirect",
    register(container) {
        container.register(DeleteRedirectRepository).inSingletonScope();
        container.register(DeleteRedirectUseCase);
    }
});
