import { createFeature } from "@webiny/feature/admin";
import { ListRedirectsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListRedirectsUseCase } from "./ListRedirectsUseCase.js";
import { ListRedirectsGateway } from "./ListRedirectsGateway.js";

export const ListRedirectsFeature = createFeature({
    name: "WebsiteBuilder/ListRedirects",
    register(container) {
        container.register(ListRedirectsUseCase);
        container.register(ListRedirectsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
