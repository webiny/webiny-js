import { createFeature } from "@webiny/feature/admin";
import { AssumedRolePresenter as Abstraction } from "./abstractions.js";
import { AssumedRolePresenter } from "./AssumedRolePresenter.js";

export const AssumedRolePresenterFeature = createFeature({
    name: "AssumedRolePresenter",
    register(container) {
        container.register(AssumedRolePresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
