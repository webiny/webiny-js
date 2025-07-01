import { Plugin } from "@webiny/plugins";
import { CmsPrivateModelFull, createModelField } from "@webiny/api-headless-cms";
import type { CmsModelField } from "@webiny/api-headless-cms/types";
import { PAGE_MODEL_ID } from "~/page/page.model";

class CmsModelFieldsModifier {
    private fields: CmsModelField[];

    constructor(fields: CmsModelField[]) {
        this.fields = fields;
    }

    addField(field: CmsModelField) {
        this.fields.push({
            ...field,
            storageId: `${field.type}@${field.id}`
        });
    }
}

interface CmsModelModifierCallableParams {
    modifier: CmsModelFieldsModifier;
}

interface CmsModelModifierCallable {
    (params: CmsModelModifierCallableParams): Promise<void> | void;
}

export class CmsModelModifierPlugin extends Plugin {
    public static override type = "wb-page.cms-model-modifier";
    private readonly modelId: string;
    private readonly cb: CmsModelModifierCallable;

    constructor(modelId: string, cb: CmsModelModifierCallable) {
        super();
        this.modelId = modelId;
        this.cb = cb;
    }

    async modifyModel(model: CmsPrivateModelFull): Promise<void> {
        if (model.modelId !== this.modelId) {
            return;
        }

        let extensionsField = model.fields.find(field => field.fieldId === "extensions");
        if (!extensionsField) {
            extensionsField = createModelField({
                label: "Extensions",
                type: "object",
                settings: {
                    layout: [],
                    fields: []
                }
            });
            model.fields.push(extensionsField);
        }

        const modifier = new CmsModelFieldsModifier(extensionsField.settings!.fields!);
        await this.cb({ modifier });
    }
}

export const createPageModelModifier = (cb: CmsModelModifierCallable) => {
    return new CmsModelModifierPlugin(PAGE_MODEL_ID, cb);
};
