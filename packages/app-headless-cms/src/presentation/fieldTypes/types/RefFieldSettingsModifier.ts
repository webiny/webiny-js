import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { CmsFieldEditorGroupModifier } from "../../fieldEditor/abstractions.js";
import type {
    ICmsFieldEditorFormBuilder,
    ICmsFieldEditorContext
} from "../../fieldEditor/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { ListModelsUseCase } from "~/features/model/listModels/abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";

class RefFieldSettingsModifierImpl implements CmsFieldEditorGroupModifier.Interface {
    group = "general";

    constructor(
        private useCase: ListModelsUseCase.Interface,
        private cache: ModelsCache.Interface
    ) {}

    shouldApply(context: ICmsFieldEditorContext) {
        return context.fieldType.type === "ref";
    }

    modifyForm(form: ICmsFieldEditorFormBuilder) {
        void this.useCase.execute();

        form.fields(fields => ({
            models: fields
                .text()
                .list()
                .label("Content models")
                .required("Please select at least one content model.")
                .options(() => this.getModelOptions())
                .renderer("multiAutoComplete")
        }));
        form.layout(layout => [layout.row("models")]);
    }

    mapToForm(field: CmsModelField) {
        const models = field.settings?.models || [];
        return { models: models.map((m: any) => m.modelId) };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        if (!field.settings) {
            field.settings = {};
        }
        field.settings.models = (formData.models || []).map((id: string) => ({ modelId: id }));
    }

    private getModelOptions() {
        return this.cache
            .getItems()
            .filter(model => {
                if (model.tags && model.tags.includes(CMS_MODEL_SINGLETON_TAG)) {
                    return false;
                }
                if (model.modelId.startsWith("wby")) {
                    return false;
                }
                return true;
            })
            .map(model => ({ label: model.name, value: model.modelId }));
    }
}

export const RefFieldSettingsModifier = CmsFieldEditorGroupModifier.createImplementation({
    implementation: RefFieldSettingsModifierImpl,
    dependencies: [ListModelsUseCase, ModelsCache]
});
