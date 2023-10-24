import WebinyError from "@webiny/error";
import lodashCamelCase from "lodash/camelCase";
import camelCase from "lodash/camelCase";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";
import { Plugin } from "@webiny/plugins";
import {
    CmsModel as CmsModelBase,
    CmsModelField as CmsModelFieldBase,
    CmsModelFieldSettings as BaseCmsModelFieldSettings
} from "~/types";
import { createFieldStorageId } from "~/crud/contentModel/createFieldStorageId";

const createApiName = (name: string) => {
    return upperFirst(camelCase(name));
};

const createPluralApiName = (name: string) => {
    return pluralize(createApiName(name));
};

interface CmsModelFieldSettings extends Omit<BaseCmsModelFieldSettings, "fields"> {
    /**
     * Object field has child fields.
     */
    fields?: CmsModelFieldInput[];
}

interface CmsModelFieldInput extends Omit<CmsModelFieldBase, "storageId" | "settings"> {
    /**
     * If defined, it must be camelCased string.
     * This is for backwards compatibility - before fields had storageId.
     *
     * This should only be populated in old model fields.
     * News ones must have this empty.
     */
    storageId?: string;
    /**
     * We must have a possibility to have a nested field defined without the storageId.
     */
    settings?: CmsModelFieldSettings;
}

export interface CmsApiModel
    extends Omit<
        CmsModel,
        "isPrivate" | "fields" | "singularApiName" | "pluralApiName" | "isPlugin"
    > {
    isPrivate?: never;
    noValidate?: never;
    singularApiName?: string;
    pluralApiName?: string;
    fields: CmsModelFieldInput[];
}

export interface CmsApiModelFull extends Omit<CmsApiModel, "fields" | "noValidate"> {
    noValidate: true;
    fields: CmsModelFieldBase[];
}

interface CmsPrivateModel
    extends Omit<
        CmsModel,
        "isPrivate" | "singularApiName" | "pluralApiName" | "fields" | "isPlugin"
    > {
    noValidate?: never;
    singularApiName?: never;
    pluralApiName?: never;
    isPrivate: true;
    fields: CmsModelFieldInput[];
}

export interface CmsPrivateModelFull extends Omit<CmsPrivateModel, "fields" | "noValidate"> {
    fields: CmsModelFieldBase[];
    noValidate: true;
}

export type CmsModelInput = CmsApiModel | CmsPrivateModel | CmsApiModelFull | CmsPrivateModelFull;

interface CmsModel extends Omit<CmsModelBase, "locale" | "tenant" | "webinyVersion"> {
    locale?: string;
    tenant?: string;
}

interface CmsModelPluginOptions {
    validateLayout?: boolean;
}

export class CmsModelPlugin extends Plugin {
    public static override readonly type: string = "cms-content-model";
    public readonly contentModel: CmsModel;

    private readonly options: CmsModelPluginOptions;

    constructor(contentModel: CmsModelInput, options?: CmsModelPluginOptions) {
        super();
        this.options = options || {};
        this.contentModel = this.buildModel(contentModel);
    }

    private buildModel(input: CmsModelInput): CmsModel {
        const isPrivate = input.isPrivate || false;
        const singularApiName = input.singularApiName
            ? createApiName(input.singularApiName)
            : createApiName(input.name);
        const pluralApiName = input.pluralApiName
            ? createApiName(input.pluralApiName)
            : createPluralApiName(input.name);

        if (input.noValidate) {
            /**
             * We can safely ignore this error, because we are sure noValidate is not a model field.
             */
            // @ts-expect-error
            delete input["noValidate"];
            return {
                ...input,
                isPlugin: true,
                isPrivate,
                singularApiName,
                pluralApiName
            };
        }

        const model: CmsModel = {
            ...input,
            isPlugin: true,
            isPrivate,
            singularApiName,
            pluralApiName,
            fields: this.buildFields(input, input.fields)
        };
        this.validateLayout(model);
        return model;
    }

    private buildFields(
        model: CmsModelInput,
        inputFields: CmsModelFieldInput[]
    ): CmsModelFieldBase[] {
        if (inputFields.length === 0) {
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
        for (const input of inputFields) {
            /**
             * Field must contain an fieldId. It is required in the graphql, but lets check it just in case
             */
            if (!(input.fieldId || "").trim()) {
                throw new WebinyError(
                    `Field's "storageId" is not defined for the content model "${model.modelId}".`,
                    "FIELD_ID_ERROR",
                    {
                        model,
                        field: input
                    }
                );
            }
            const fieldId = lodashCamelCase(input.fieldId);
            /**
             * FieldID must be in correct pattern.
             */
            if (fieldId.match(/^[0-9]/) !== null) {
                throw new WebinyError(
                    `Field's "fieldId" does not match correct pattern in the content model "${model.modelId}" - cannot start with a number.`,
                    "FIELD_FIELD_ID_ERROR",
                    {
                        model,
                        field: input
                    }
                );
            }
            /**
             * FieldID also must be camelCased.
             */
            if (fieldId !== input.fieldId) {
                throw new WebinyError(
                    `Field's "fieldId" must be a camel cased string in the content model "${model.modelId}".`,
                    "FIELD_FIELD_ID_ERROR",
                    {
                        model,
                        field: input
                    }
                );
            }
            /**
             * ... and fieldId must be unique.
             */
            if (fieldIdList.includes(fieldId) === true) {
                throw new WebinyError(
                    `Field's "fieldId" is not unique in the content model "${model.modelId}".`,
                    "FIELD_ID_NOT_UNIQUE_ERROR",
                    {
                        model,
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
                    `Field's "storageId" of the field with "fieldId" ${input.fieldId} is not camel cased string in the content model "${model.modelId}".`,
                    "STORAGE_ID_NOT_CAMEL_CASED_ERROR",
                    {
                        model,
                        storageId,
                        field: input
                    }
                );
            } else if (!storageId) {
                storageId = createFieldStorageId(input);
            }

            /**
             * Fields storageId must be unique.
             */
            if (storageIdList.includes(storageId) === true) {
                throw new WebinyError(
                    `Field's "storageId" is not unique in the content model "${model.modelId}".`,
                    "STORAGE_ID_ERROR",
                    {
                        model,
                        field: input
                    }
                );
            }

            /**
             * We can safely ignore error because we are going through the fields and making sure each has storageId.
             */
            // @ts-ignore
            let settings: BaseCmsModelFieldSettings = input.settings;

            const childFields = settings?.fields || [];
            if (input.type === "object" && childFields.length > 0) {
                settings = {
                    ...(settings || {}),
                    fields: this.buildFields(model, childFields)
                };
            }

            const field: CmsModelFieldBase = {
                ...input,
                settings,
                storageId
            };
            /**
             * Add all relevant data to arrays.
             */
            fields.push(field);
            storageIdList.push(field.storageId);
            fieldIdList.push(field.fieldId);
        }
        return fields;
    }

    private validateLayout(model: CmsModel): void {
        /**
         * Only skip validation if option.validateLayout was set as false, explicitly.
         */
        if (this.options.validateLayout === false) {
            return;
        }
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

export const createCmsModel = (
    model: CmsModelInput,
    options?: CmsModelPluginOptions
): CmsModelPlugin => {
    return new CmsModelPlugin(model, options);
};
