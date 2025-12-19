import { createFeature } from "@webiny/feature/api";
import { CreateRedirectRepository } from "./CreateRedirectRepository.js";
import { CreateRedirectUseCase } from "./CreateRedirectUseCase.js";

export const CreateRedirectFeature = createFeature({
    name: "WebsiteBuilder/CreateRedirect",
    register(container) {
        container.register(CreateRedirectRepository).inSingletonScope();
        container.register(CreateRedirectUseCase);
    }
});
