import { createFeature } from "@webiny/feature/admin";
import { CustomIconsPresenter as Abstraction } from "./abstractions.js";
import { CustomIconsPresenter } from "./CustomIconsPresenter.js";

export const CustomIconsPresenterFeature = createFeature({
    name: "IconPicker/CustomIconsPresenter",
    register(container) {
        container.register(CustomIconsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
