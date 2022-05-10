import { Plugin } from "@webiny/plugins";
import { CmsModel as CmsModelBase } from "~/types";
import WebinyError from "@webiny/error";

export interface CmsModel extends Omit<CmsModelBase, "locale" | "tenant" | "webinyVersion"> {
    locale?: string;
    tenant?: string;
}

export class CmsModelPlugin extends Plugin {
    public static override readonly type: string = "cms-content-model";
    contentModel: CmsModel;

    constructor(contentModel: CmsModel) {
        super();
        this.contentModel = contentModel;
        this.validateFields();
    }

    private validateFields(): void {
        const fieldIdList: string[] = [];
        const aliases: string[] = [];
        for (const field of this.contentModel.fields) {
            if (!field.fieldId) {
                throw new WebinyError(
                    `Fields "fieldId" is not defined for the content model "${this.contentModel.modelId}".`,
                    "FIELD_ID_ERROR",
                    {
                        model: this.contentModel,
                        field
                    }
                );
            }
            if (fieldIdList.includes(field.fieldId) === true) {
                throw new WebinyError(
                    `Fields "fieldId" is not unique in the content model "${this.contentModel.modelId}".`,
                    "FIELD_ID_ERROR",
                    {
                        model: this.contentModel,
                        field
                    }
                );
            }

            fieldIdList.push(field.fieldId);
            if (aliases.includes(field.alias) === true) {
                throw new WebinyError(
                    `Fields "alias" is not unique in the content model "${this.contentModel.modelId}".`,
                    "ALIAS_ERROR",
                    {
                        model: this.contentModel,
                        field
                    }
                );
            }
            aliases.push(field.alias);
        }
    }
}
