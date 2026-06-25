import { createFeature } from "@webiny/feature/admin";
import { ApiKeysPresenter as Abstraction } from "./abstractions.js";
import { ApiKeysPresenter } from "./ApiKeysPresenter.js";

export const ApiKeysPresenterFeature = createFeature({
    name: "AccessManagement/ApiKeysPresenter",
    register(container) {
        container.register(ApiKeysPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
