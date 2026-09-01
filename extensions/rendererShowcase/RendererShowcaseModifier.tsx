import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import { ContentEntryFormModelModifier } from "webiny/admin/cms/entry/editor";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { RENDERER_SHOWCASE_MODEL_ID } from "./RendererShowcaseModel.js";

class RendererShowcaseModifierImpl implements ContentEntryFormModelModifier.Interface {
    modifyForm(form: IFormModel, model: CmsModel) {
        if (model.modelId !== RENDERER_SHOWCASE_MODEL_ID) {
            return;
        }

        form.traverse(field => {
            if (field.getTags().includes("uuid")) {
                field.defaultValue(() => String(Date.now()));
                field.cloneValue(() => String(Date.now()));
                field.disabled(true);
            }
        });
    }
}

const RendererShowcaseModifierFeature = createFeature({
    name: "RendererShowcaseModifier",
    register(container) {
        container.register(
            ContentEntryFormModelModifier.createImplementation({
                implementation: RendererShowcaseModifierImpl,
                dependencies: []
            })
        );
    }
});

export default () => {
    return <RegisterFeature feature={RendererShowcaseModifierFeature} />;
};
