import { createFeature } from "@webiny/feature/admin";
import { SelfHostedAuthPresenter } from "./SelfHostedAuthPresenter.js";
import { SelfHostedAuthPresenter as Presenter } from "./abstractions.js";

export const SelfHostedAuthFeature = createFeature({
    name: "SelfHostedAuth",
    register(container) {
        container.register(SelfHostedAuthPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Presenter)
        };
    }
});
