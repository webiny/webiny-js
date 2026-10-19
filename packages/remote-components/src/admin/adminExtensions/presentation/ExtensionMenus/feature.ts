import { createFeature } from "@webiny/feature/admin";
import { ExtensionMenusPresenter as PresenterAbstraction } from "./abstractions.js";
import { ExtensionMenusPresenter } from "./ExtensionMenusPresenter.js";

export const ExtensionMenusFeature = createFeature({
    name: "RemoteComponents/ExtensionMenus",
    register(container) {
        // Singleton: the management screen reloads the same instance the sidebar reads.
        container.register(ExtensionMenusPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
