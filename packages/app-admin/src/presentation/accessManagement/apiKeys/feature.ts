import { createFeature } from "@webiny/feature/admin";
import { ApiKeysPresenter } from "./abstractions.js";
import { ApiKeysPresenterImplementation } from "./ApiKeysPresenter.js";

export const ApiKeysPresenterFeature = createFeature({
    name: "AccessManagement/ApiKeysPresenter",
    register(container) {
        container.register(ApiKeysPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(ApiKeysPresenter)
        };
    }
});
