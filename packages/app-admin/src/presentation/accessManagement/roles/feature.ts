import { createFeature } from "@webiny/feature/admin";
import { RolesPresenter as Abstraction } from "./abstractions.js";
import { RolesPresenter } from "./RolesPresenter.js";

export const RolesPresenterFeature = createFeature({
    name: "AccessManagement/RolesPresenter",
    register(container) {
        container.register(RolesPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
