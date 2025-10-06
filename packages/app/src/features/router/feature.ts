import { RouterRepository } from "~/features/router/RouterRepository.js";
import { RouterPresenter } from "~/features/router/RouterPresenter.js";
import * as Abstractions from "~/features/router/abstractions.js";
import { createFeature } from "~/shared/di/createFeature.js";

export const RouterFeature = createFeature({
    name: "Router",
    register(container) {
        container.register(RouterRepository).inSingletonScope();
        container.register(RouterPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstractions.RouterPresenter)
        };
    }
});
