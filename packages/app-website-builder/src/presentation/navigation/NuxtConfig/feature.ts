import { createFeature } from "@webiny/feature/admin";
import { NuxtConfigPresenter as PresenterAbstraction } from "./abstractions.js";
import { NuxtConfigPresenter } from "./NuxtConfigPresenter.js";
import { NuxtConfigRepository } from "./NuxtConfigRepository.js";
import { NuxtConfigGateway } from "./NuxtConfigGateway.js";

export const NuxtConfigFeature = createFeature({
    name: "NuxtConfig",
    register(container) {
        container.register(NuxtConfigPresenter);
        container.register(NuxtConfigRepository).inSingletonScope();
        container.register(NuxtConfigGateway);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
