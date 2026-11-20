import { createFeature } from "@webiny/feature/admin";
import { LayoutPropertiesPresenter as PresenterAbstraction } from "./abstractions.js";
import { LayoutPropertiesPresenterRegistration } from "./LayoutPropertiesPresenter.js";

export const LayoutPropertiesFeature = createFeature({
    name: "WebsiteBuilder/LayoutEditor/Properties",
    register(container) {
        container.register(LayoutPropertiesPresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
