import { createFeature } from "@webiny/feature/admin";
import { KeycloakPresenter } from "./KeycloakPresenter.js";
import { KeycloakPresenter as Presenter } from "./abstractions.js";

export const KeycloakFeature = createFeature({
    name: "Keycloak",
    register(container) {
        container.register(KeycloakPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Presenter)
        };
    }
});
