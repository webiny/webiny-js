import { createFeature } from "@webiny/feature/admin";
import { DeleteRedirectUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteRedirectUseCase } from "./DeleteRedirectUseCase2.js";
import { DeleteRedirectGateway } from "./DeleteRedirectGateway.js";

export const DeleteRedirectFeature = createFeature({
    name: "WebsiteBuilder/DeleteRedirect",
    register(container) {
        container.register(DeleteRedirectUseCase);
        container.register(DeleteRedirectGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
