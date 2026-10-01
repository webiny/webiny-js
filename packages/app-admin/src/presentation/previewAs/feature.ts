import { createFeature } from "@webiny/feature/admin";
import { PreviewPresenter as Abstraction } from "./abstractions.js";
import { PreviewPresenter } from "./PreviewPresenter.js";

export const PreviewPresenterFeature = createFeature({
    name: "PreviewPresenter",
    register(container) {
        container.register(PreviewPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
