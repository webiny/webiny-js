import { createFeature } from "@webiny/feature/admin";
import { PageSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { PageSettingsPresenterRegistration } from "./PageSettingsPresenter.js";
import { GeneralSettingsGroup } from "./groups/GeneralSettingsGroup.js";
import { SeoSettingsGroup } from "./groups/SeoSettingsGroup.js";
import { SocialSettingsGroup } from "./groups/SocialSettingsGroup.js";
import { SchemaSettingsGroup } from "./groups/SchemaSettingsGroup.js";

export const PageSettingsFeature = createFeature({
    name: "PageEditor/Settings",
    register(container) {
        container.register(GeneralSettingsGroup);
        container.register(SeoSettingsGroup);
        container.register(SocialSettingsGroup);
        container.register(SchemaSettingsGroup);
        container.register(PageSettingsPresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
