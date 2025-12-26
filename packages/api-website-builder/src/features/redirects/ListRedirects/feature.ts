import { createFeature } from "@webiny/feature/api";
import { ListRedirectsRepository } from "./ListRedirectsRepository.js";
import { ListRedirectsUseCase } from "./ListRedirectsUseCase.js";

export const ListRedirectsFeature = createFeature({
    name: "WebsiteBuilder/ListRedirects",
    register(container) {
        container.register(ListRedirectsRepository).inSingletonScope();
        container.register(ListRedirectsUseCase);
    }
});
