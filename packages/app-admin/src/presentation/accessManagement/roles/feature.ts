import { createFeature } from "@webiny/feature/admin";
import { RolesPresenter } from "./abstractions.js";
import { RolesPresenterImplementation } from "./RolesPresenter.js";

export const RolesPresenterFeature = createFeature({
    name: "AccessManagement/RolesPresenter",
    register(container) {
        container.register(RolesPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(RolesPresenter)
        };
    }
});
