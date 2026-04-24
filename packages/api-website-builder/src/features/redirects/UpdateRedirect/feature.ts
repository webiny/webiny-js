import { createFeature } from "@webiny/feature/api";
import { UpdateRedirectRepository } from "./UpdateRedirectRepository.js";
import { UpdateRedirectUseCase } from "./UpdateRedirectUseCase.js";

export const UpdateRedirectFeature = createFeature({
    name: "WebsiteBuilder/UpdateRedirect",
    register(container) {
        container.register(UpdateRedirectRepository).inSingletonScope();
        container.register(UpdateRedirectUseCase);
    }
});
