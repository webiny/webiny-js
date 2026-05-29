import { createFeature } from "@webiny/feature/admin";
import { UpdateRedirectUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateRedirectUseCase } from "./UpdateRedirectUseCase2.js";
import { UpdateRedirectGateway } from "./UpdateRedirectGateway.js";

export const UpdateRedirectFeature = createFeature({
    name: "WebsiteBuilder/UpdateRedirect",
    register(container) {
        container.register(UpdateRedirectUseCase);
        container.register(UpdateRedirectGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
