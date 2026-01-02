import { createFeature } from "@webiny/feature/admin";
import { Auth0Presenter } from "./Auth0Presenter.js";
import { Auth0Presenter as Presenter } from "./abstractions.js";

export const Auth0Feature = createFeature({
    name: "Auth0",
    register(container) {
        container.register(Auth0Presenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Presenter)
        };
    }
});
