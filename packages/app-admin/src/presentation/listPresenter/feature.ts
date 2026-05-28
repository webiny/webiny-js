import { createFeature } from "@webiny/feature/admin";
import { ListPresenter as Abstraction } from "./abstractions.js";
import { ListPresenter } from "./ListPresenter.js";

export const ListPresenterFeature = createFeature({
    name: "ListPresenter",
    register(container) {
        container.register(ListPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
