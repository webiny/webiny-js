import { createFeature } from "@webiny/feature/admin";
import { EnabledExtensionsPresenter as PresenterAbstraction } from "./abstractions.js";
import { EnabledExtensionsPresenter } from "./EnabledExtensionsPresenter.js";

export const EnabledExtensionsFeature = createFeature({
    name: "RemoteComponents/EnabledExtensions",
    register(container) {
        // Singleton: the management screen reloads the same instance the admin reads.
        container.register(EnabledExtensionsPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
