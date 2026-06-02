import { createFeature } from "@webiny/feature/admin";
import { TrashBinPresenter as Abstraction } from "./abstractions.js";
import { TrashBinPresenterImplementation } from "./TrashBinPresenter.js";

export const TrashBinFeature = createFeature({
    name: "TrashBin",
    register(container) {
        container.register(TrashBinPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
