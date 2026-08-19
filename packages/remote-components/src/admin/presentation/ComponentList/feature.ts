import { createFeature } from "@webiny/feature/admin";
import { ComponentListPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentListPresenter } from "./ComponentListPresenter.js";

export const ComponentListFeature = createFeature({
    name: "RemoteComponents/ComponentList",
    register(container) {
        container.register(ComponentListPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
