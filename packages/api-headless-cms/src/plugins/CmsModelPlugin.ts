import { Plugin } from "@webiny/plugins";
import { CmsModel as CmsModelBase, CmsModelField as CmsModelFieldBase } from "~/types";
import WebinyError from "@webiny/error";
import { createFieldStorageId } from "~/crud/contentModel/createFieldStorageId";
import lodashCamelCase from "lodash/camelCase";

interface CmsModelFieldInput extends Omit<CmsModelFieldBase, "storageId"> {
    /**
     * If defined, it must be camelCased string.
     * This is for backwards compatibility - before fields had storageId.
     *
     * This should only be populated in old model fields.
     * News ones must have this empty.
     */
    storageId?: string;
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
    public readonly contentModel: CmsModel;

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
        const storageIdList: string[] = [];
        const fieldIdList: string[] = [];
        for (const input of model.fields) {
            /**
             * Field must contain an fieldId. It is required in the graphql, but lets check it just in case
             */
            if (!(input.fieldId || "").trim()) {
                throw new WebinyError(
                    `Field's "storageId" is not defined for the content model "${this.contentModel.modelId}".`,
                    "FIELD_ID_ERROR",
                    {
                        model: this.contentModel,
                        field: input
                    }
                );
            }
            const fieldId = lodashCamelCase(input.fieldId);
            /**
             * Alias must be in correct pattern.
             */
            if (fieldId.match(/^[0-9]/) !== null) {
                throw new WebinyError(
                    `Field's "fieldId" does not match correct pattern in the content model "${this.contentModel.modelId}" - cannot start with a number.`,
                    "FIELD_FIELD_ID_ERROR",
                    {
                        model: this.contentModel,
                        field: input
                    }
                );
            }
            /**
             * Alias also must be camelCased.
             */
            if (fieldId !== input.fieldId) {
                throw new WebinyError(
                    `Field's "fieldId" must be a camel cased string in the content model "${this.contentModel.modelId}".`,
                    "FIELD_FIELD_ID_ERROR",
                    {
                        model: this.contentModel,
                        field: input
                    }
                );
            }
            /**
             * ... and fieldId must be unique.
             */
            if (fieldIdList.includes(fieldId) === true) {
                throw new WebinyError(
                    `Field's "fieldId" is not unique in the content model "${this.contentModel.modelId}".`,
                    "FIELD_ID_NOT_UNIQUE_ERROR",
                    {
                        model: this.contentModel,
                        field: input
                    }
                );
            }

            let storageId = input.storageId ? lodashCamelCase(input.storageId) : null;
            /**
             * If defined, storageId MUST be camel cased string - for backward compatibility.
             */
            if (
                storageId &&
                (storageId.match(/^([a-zA-Z-0-9]+)$/) === null || storageId !== input.storageId)
            ) {
                throw new WebinyError(
                    `Field's "storageId" is not camel cased string in the content model "${this.contentModel.modelId}".`,
                    "STORAGE_ID_NOT_CAMEL_CASED_ERROR",
                    {
                        model: this.contentModel,
                        field: input
                    }
                );
            } else if (!storageId) {
                storageId = createFieldStorageId(input);
            }

            const field = {
                ...input,
                storageId
            };
            /**
             * Fields storageId must be unique.
             */
            if (storageIdList.includes(field.storageId) === true) {
                throw new WebinyError(
                    `Field's "storageId" is not unique in the content model "${this.contentModel.modelId}".`,
                    "STORAGE_ID_ERROR",
                    {
                        model: this.contentModel,
                        field
                    }
                );
            }
            fields.push(field);
            storageIdList.push(field.storageId);
            fieldIdList.push(field.fieldId);
        }
        return fields;
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
