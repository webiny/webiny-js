import { createFeature } from "@webiny/feature/admin";
import { FieldEditorPresenterRegistration } from "./FieldEditorPresenter.js";
import { GeneralGroup } from "./groups/GeneralGroup.js";
import { AppearanceGroup } from "./groups/AppearanceGroup.js";
import { PredefinedValuesGroup } from "./groups/PredefinedValuesGroup.js";

export const FieldEditorFeature = createFeature({
    name: "CmsFieldEditor",
    register(container) {
        container.register(FieldEditorPresenterRegistration);
        container.register(GeneralGroup);
        container.register(AppearanceGroup);
        container.register(PredefinedValuesGroup);
    }
});
