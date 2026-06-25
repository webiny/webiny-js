import { createFeature } from "@webiny/feature/admin";
import { TrashBinPresenter as Abstraction } from "./abstractions.js";
import { TrashBinPresenter } from "./TrashBinPresenter.js";

export const TrashBinFeature = createFeature({
    name: "TrashBin",
    register(container) {
        container.register(TrashBinPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
