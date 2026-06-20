import { createFeature } from "@webiny/feature/admin";
import { FieldEditorPresenterRegistration } from "./FieldEditorPresenter.js";
import { GeneralGroup } from "./groups/GeneralGroup.js";
import { TextFieldSettingsModifier } from "./groups/TextFieldSettingsModifier.js";

export const FieldEditorFeature = createFeature({
    name: "CmsFieldEditor",
    register(container) {
        container.register(FieldEditorPresenterRegistration);
        container.register(GeneralGroup);
        container.register(TextFieldSettingsModifier);
    }
});
