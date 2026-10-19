import { createFeature } from "@webiny/feature/admin";
import { AdminExtensionListPresenter as PresenterAbstraction } from "./abstractions.js";
import { AdminExtensionListPresenter } from "./AdminExtensionListPresenter.js";

export const AdminExtensionListFeature = createFeature({
    name: "RemoteComponents/AdminExtensionList",
    register(container) {
        container.register(AdminExtensionListPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
