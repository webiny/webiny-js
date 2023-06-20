import { Plugin } from "@webiny/plugins";
import { CmsModelField as BaseModelField } from "@webiny/api-headless-cms/types";
import { FILE_MODEL_ID } from "~/cmsFileStorage/file.model";
import { createModelField } from "~/cmsFileStorage/createModelField";
import { CmsPrivateModelFull } from "@webiny/api-headless-cms";

type CmsModelField = Omit<BaseModelField, "storageId">;

class CmsModelFieldsModifier {
    private fields: BaseModelField[];

    constructor(fields: BaseModelField[]) {
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
    public static override type = "fm.cms-model-modifier";
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

export const createFileModelModifier = (cb: CmsModelModifierCallable) => {
    return new CmsModelModifierPlugin(FILE_MODEL_ID, cb);
};
