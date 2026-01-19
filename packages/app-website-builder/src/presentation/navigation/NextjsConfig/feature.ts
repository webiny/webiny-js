import { createFeature } from "@webiny/feature/admin";
import { NextjsConfigPresenter as PresenterAbstraction } from "./abstractions.js";
import { NextjsConfigPresenter } from "./NextjsConfigPresenter.js";
import { NextjsConfigRepository } from "./NextjsConfigRepository.js";
import { NextjsConfigGateway } from "./NextjsConfigGateway.js";

export const NextjsConfigFeature = createFeature({
    name: "NextjsConfig",
    register(container) {
        container.register(NextjsConfigPresenter);
        container.register(NextjsConfigRepository).inSingletonScope();
        container.register(NextjsConfigGateway);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
