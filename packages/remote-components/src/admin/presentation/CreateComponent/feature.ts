import { createFeature } from "@webiny/feature/admin";
import { CreateComponentPresenter as PresenterAbstraction } from "./abstractions.js";
import { CreateComponentPresenter } from "./CreateComponentPresenter.js";

export const CreateComponentFeature = createFeature({
    name: "RemoteComponents/CreateComponent",
    register(container) {
        container.register(CreateComponentPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
