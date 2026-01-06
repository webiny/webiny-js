import { createFeature } from "@webiny/feature/admin";
import { OktaPresenter } from "./OktaPresenter.js";
import { OktaPresenter as Presenter } from "./abstractions.js";

export const OktaFeature = createFeature({
    name: "Okta",
    register(container) {
        container.register(OktaPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Presenter)
        };
    }
});
