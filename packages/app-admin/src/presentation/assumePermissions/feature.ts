import { createFeature } from "@webiny/feature/admin";
import { AssumePermissionsPresenter as Abstraction } from "./abstractions.js";
import { AssumePermissionsPresenter } from "./AssumePermissionsPresenter.js";

export const AssumePermissionsPresenterFeature = createFeature({
    name: "AssumePermissionsPresenter",
    register(container) {
        container.register(AssumePermissionsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
