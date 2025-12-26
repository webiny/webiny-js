import { createFeature } from "@webiny/feature/api";
import { GetActiveRedirectsRepository } from "./GetActiveRedirectsRepository.js";
import { GetActiveRedirectsUseCase } from "./GetActiveRedirectsUseCase.js";

export const GetActiveRedirectsFeature = createFeature({
    name: "WebsiteBuilder/GetActiveRedirects",
    register(container) {
        container.register(GetActiveRedirectsRepository).inSingletonScope();
        container.register(GetActiveRedirectsUseCase);
    }
});
