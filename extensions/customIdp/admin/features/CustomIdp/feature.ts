import { createFeature } from "webiny/admin";
import { CustomIdpConfig, CustomIdpPresenter as PresenterAbstraction } from "./abstractions.js";
import { CustomIdpPresenter } from "./CustomIdpPresenter.js";
import { CustomIdpRepository } from "./CustomIdpRepository.js";
import { JwtValidationGateway } from "./JwtValidationGateway.js";
import { TokenRefreshGateway } from "./TokenRefreshGateway.js";
import { IdpRedirectGateway } from "./IdpRedirectGateway.js";
import { AuthenticationErrorHandler } from "./AuthenticationErrorHandler.js";

export interface CustomIdpOptions {
    loginUrl: string;
    refreshUrl: string;
    refreshIntervalSeconds: number;
}

export const CustomIdpFeature = createFeature({
    name: "CustomIdp",
    register(container, options: CustomIdpOptions) {
        // Register config instance
        container.registerInstance(CustomIdpConfig, options);

        // Presenter (transient)
        container.register(CustomIdpPresenter);

        // Repository (singleton)
        container.register(CustomIdpRepository).inSingletonScope();

        // Gateways (singleton)
        container.register(JwtValidationGateway).inSingletonScope();
        container.register(TokenRefreshGateway).inSingletonScope();
        container.register(IdpRedirectGateway).inSingletonScope();

        // Error handler (singleton)
        container.register(AuthenticationErrorHandler).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
