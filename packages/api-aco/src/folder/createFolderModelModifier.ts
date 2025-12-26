import { Plugin } from "@webiny/plugins";
import type { CmsPrivateModelFull } from "@webiny/api-headless-cms";
import { createModelField } from "@webiny/api-headless-cms";
import type { CmsModelField as BaseModelField } from "@webiny/api-headless-cms/types/index.js";
import { FOLDER_MODEL_ID } from "~/domain/folder/folder.model.js";

export type CmsModelField = Omit<BaseModelField, "storageId"> & { modelIds?: string[] };

export interface IFolderModelFieldsModifier {
    setFields: (fields: BaseModelField[]) => void;
    addField: (field: CmsModelField) => void;
}

export class FolderModelFieldsModifier implements IFolderModelFieldsModifier {
    private fields: BaseModelField[] = [];
    private readonly namespace: string;

    constructor(namespace: string) {
        this.namespace = namespace;
    }

    setFields(fields: BaseModelField[]) {
        this.fields = fields;
    }

    addField(field: CmsModelField) {
        const { tags, ...rest } = field;

        this.fields.push({
            ...rest,
            storageId: `${field.type}@${this.namespace}_${field.id}`,
            tags: (tags ?? []).concat([`$namespace:${this.namespace}`])
        });
    }
}

interface CmsModelModifierCallableParams {
    modifier: IFolderModelFieldsModifier;
}

export interface CmsModelModifierCallable {
    (params: CmsModelModifierCallableParams): Promise<void> | void;
}

interface FolderCmsModelModifierPluginParams {
    modifier: IFolderModelFieldsModifier;
    callback: CmsModelModifierCallable;
}

export class FolderCmsModelModifierPlugin extends Plugin {
    public static override type = "aco.folder.cms-model-modifier";
    private readonly modifier: IFolderModelFieldsModifier;
    private readonly callback: CmsModelModifierCallable;

    constructor(params: FolderCmsModelModifierPluginParams) {
        super();
        this.modifier = params.modifier;
        this.callback = params.callback;
    }

    async modifyModel(model: CmsPrivateModelFull): Promise<void> {
        if (model.modelId !== FOLDER_MODEL_ID) {
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

        this.modifier.setFields(extensionsField.settings!.fields!);

        await this.callback({ modifier: this.modifier });
    }
}

export const createFolderModelModifier = (callback: CmsModelModifierCallable) => {
    const modifier = new FolderModelFieldsModifier("global");

    return new FolderCmsModelModifierPlugin({
        callback,
        modifier
    });
};
