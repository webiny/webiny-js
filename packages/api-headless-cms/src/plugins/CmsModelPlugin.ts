import { Plugin } from "@webiny/plugins";
import { CmsModel as CmsModelBase, CmsModelField as CmsModelFieldBase } from "~/types";
import WebinyError from "@webiny/error";
import { createFieldId } from "~/crud/contentModel/createFieldId";
import lodashCamelCase from "lodash/camelCase";

interface CmsModelFieldInput extends Omit<CmsModelFieldBase, "fieldId"> {
    /**
     * If defined, it must be in form of createFieldIdMatchPattern()
     */
    fieldId?: string;
}

interface CmsModelInput
    extends Omit<CmsModelBase, "locale" | "tenant" | "webinyVersion" | "fields"> {
    fields: CmsModelFieldInput[];
    locale?: string;
    tenant?: string;
}
interface CmsModel extends Omit<CmsModelBase, "locale" | "tenant" | "webinyVersion"> {
    locale?: string;
    tenant?: string;
}

export class CmsModelPlugin extends Plugin {
    public static override readonly type: string = "cms-content-model";
    contentModel: CmsModel;

    constructor(contentModel: CmsModelInput) {
        super();
        this.contentModel = this.buildModel(contentModel);
    }

    private buildModel(input: CmsModelInput): CmsModel {
        const fields = this.buildFields(input);
        const model: CmsModel = {
            ...input,
            fields
        };
        this.validateLayout(model);
        return model;
    }

    private buildFields(model: CmsModelInput): CmsModelFieldBase[] {
        if (model.fields.length === 0) {
            throw new WebinyError(
                `Missing fields for the defined model "${model.modelId}".`,
                "MISSING_FIELDS",
                {
                    model
                }
            );
        }
        const fields: CmsModelFieldBase[] = [];
        const fieldIdList: string[] = [];
        const aliases: string[] = [];
        for (const input of model.fields) {
            /**
             * Field must contain an alias.
             */
            if (!input.alias.trim()) {
                throw new WebinyError(
                    `Field's "fieldId" is not defined for the content model "${this.contentModel.modelId}".`,
                    "FIELD_ID_ERROR",
                    {
                        model: this.contentModel,
                        field: input
                    }
                );
            }
            const alias = lodashCamelCase(input.alias);
            /**
             * Alias must be in correct pattern.
             */
            if (alias.match(/^[0-9]/) !== null) {
                throw new WebinyError(
                    `Field's "alias" does not match correct pattern in the content model "${this.contentModel.modelId}" - cannot start with a number.`,
                    "FIELD_ALIAS_ERROR",
                    {
                        model: this.contentModel,
                        field: input
                    }
                );
            }
            /**
             * Alias also must be camelCased.
             */
            if (alias !== input.alias) {
                throw new WebinyError(
                    `Field's "alias" must be a camel cased string in the content model "${this.contentModel.modelId}".`,
                    "FIELD_ALIAS_ERROR",
                    {
                        model: this.contentModel,
                        field: input
                    }
                );
            }
            /**
             * ... and alias must be unique.
             */
            if (aliases.includes(alias) === true) {
                throw new WebinyError(
                    `Field's "alias" is not unique in the content model "${this.contentModel.modelId}".`,
                    "ALIAS_NOT_UNIQUE_ERROR",
                    {
                        model: this.contentModel,
                        field: input
                    }
                );
            }
            const field = {
                ...input,
                fieldId: this.createFieldId(input)
            };
            /**
             * Fields fieldId must be unique.
             */
            if (fieldIdList.includes(field.fieldId) === true) {
                throw new WebinyError(
                    `Field's "fieldId" is not unique in the content model "${this.contentModel.modelId}".`,
                    "FIELD_ID_ERROR",
                    {
                        model: this.contentModel,
                        field
                    }
                );
            }
            fields.push(field);
            fieldIdList.push(field.fieldId);
            aliases.push(field.alias);
        }
        return fields;
    }

    private createFieldId(field: CmsModelFieldInput): string {
        if (!field.fieldId) {
            return createFieldId({
                type: field.type,
                id: field.id
            });
        }
        return field.fieldId;
    }

    private validateLayout(model: CmsModel): void {
        for (const field of model.fields) {
            let total = 0;
            for (const row of model.layout) {
                const count = row.filter(cell => cell === field.id).length;
                total = total + count;
            }
            if (total === 1) {
                continue;
            } else if (total > 1) {
                throw new WebinyError(
                    `Field "${field.id}" is in more than one layout cell.`,
                    "DUPLICATE_FIELD_IN_LAYOUT",
                    {
                        model,
                        field
                    }
                );
            }
            throw new WebinyError(
                `Missing field "${field.id}" in layout.`,
                "MISSING_FIELD_IN_LAYOUT",
                {
                    model,
                    field
                }
            );
        }
    }
}

export const createCmsModel = (model: CmsModel): CmsModelPlugin => {
    return new CmsModelPlugin(model);
};
