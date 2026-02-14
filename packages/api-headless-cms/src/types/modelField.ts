import type { CmsModel } from "./model.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { CmsDynamicZoneTemplate } from "~/types/fields/dynamicZoneField.js";

export type CmsModelFieldType =
    | "boolean"
    | "datetime"
    | "file"
    | "long-text"
    | "number"
    | "json"
    | "object"
    | "ref"
    | "rich-text"
    | "text"
    | "dynamicZone"
    | string;

export type ICmsModelFieldStorageId = `${string}@${string}` | string;
/**
 * A definition for content model field. This type exists on the app side as well.
 *
 * @category ModelField
 * @category Database model
 */
export interface CmsModelField {
    /**
     * A generated unique ID for the model field.
     * MUST be absolute unique throughout the models.
     * Must be in form of a-zA-Z0-9.
     *
     * We generate a unique id value when you're building a model via UI,
     * but when user is creating a model via a plugin it is up to them to be careful about this.
     */
    id: string;
    /**
     * A type of the field.
     * We are defining our built-in fields, so people know which are available by the default.
     */
    type: CmsModelFieldType;
    /**
     * A unique storage ID for storing actual values.
     * Must in form of a-zA-Z0-9@a-zA-Z0-9
     *
     * This is an auto-generated value: uses `id` and `type`
     *
     * This is used as path for the entry value.
     */
    storageId: ICmsModelFieldStorageId;
    /**
     * Field identifier for the model field that will be available to the outside world.
     * `storageId` is used as path (or column) to store the data.
     *
     * Must in form of a-zA-Z0-9.
     *
     * This value MUST be unique in the CmsModel.
     */
    fieldId: string;
    /**
     * A label for the field.
     */
    label: string;
    /**
     * Field description right below the label.
     */
    description?: string | null;
    /**
     * Note displayed below the input.
     */
    note?: string | null;
    /**
     * Text in the tooltip next to the input label.
     */
    help?: string | null;
    /**
     * Placeholder text to be displayed in the field
     */
    placeholder?: string | null;
    /**
     * Are predefined values enabled? And list of them
     */
    predefinedValues?: CmsModelFieldPredefinedValues;
    /**
     * Field renderer. Blank if determined automatically.
     */
    renderer?: CmsModelFieldRenderer | null;
    /**
     * List of validations for the field
     *
     * @default []
     */
    validation: CmsModelFieldValidation[];
    /**
     * List of validations for the list of values, when a field is set to accept a list of values.
     * These validations will be applied to the entire list, and `validation` (see above) will be applied
     * to each individual value in the list.
     *
     * @default []
     */
    listValidation: CmsModelFieldValidation[];
    /**
     * Is this a multiple values field?
     *
     */
    multipleValues?: boolean;
    /**
     * Fields can be tagged to give them contextual meaning.
     */
    tags?: string[];
    /**
     * Any user defined settings.
     *
     * @default {}
     */
    settings?: CmsModelFieldSettings;
}

/**
 * A definition for content model field received from the user.
 *
 * Input type for `CmsModelField`.
 * @see CmsModelField
 *
 * @category GraphQL params
 * @category ModelField
 */
export interface CmsModelFieldInput {
    /**
     * Generated ID.
     */
    id: string;
    /**
     * Type of the field. A plugin for the field must be defined.
     * @see CmsModelFieldToGraphQLPlugin
     */
    type: string;
    /**
     * Field outside world identifier for the field. Must be unique in the model.
     */
    fieldId: string;
    /**
     * Label for the field.
     */
    label: string;
    /**
     * Field description right below the label.
     */
    description?: string | null;
    /**
     * Note displayed below the input.
     */
    note?: string | null;
    /**
     * Text in the tooltip next to the input label.
     */
    help?: string | null;
    /**
     * Placeholder text to be displayed in the field
     */
    placeholder?: string | null;
    /**
     * Fields can be tagged to give them contextual meaning.
     */
    tags?: string[];
    /**
     * Are multiple values allowed?
     */
    multipleValues?: boolean;
    /**
     * Predefined values options for the field. Check the reference for more information.
     */
    predefinedValues?: CmsModelFieldPredefinedValues;
    /**
     * Renderer options for the field. Check the reference for more information.
     */
    renderer?: CmsModelFieldRenderer | null;
    /**
     * List of validations for the field.
     */
    validation: CmsModelFieldValidation[];
    /**
     * @see CmsModelField.listValidation
     */
    listValidation: CmsModelFieldValidation[];
    /**
     * User defined settings.
     */
    settings?: {
        [key: string]: any;
    };
}

/**
 * A GraphQL `params.data` parameter received when updating content model.
 *
 * @category GraphQL params
 * @category CmsModel
 */
export interface CmsModelUpdateInput {
    /**
     * A new content model name.
     */
    name?: string;
    /**
     * A new singular name of the content model to be used in the API.
     */
    singularApiName?: string;
    /**
     * A new plural name of the content model to be used in the API.
     */
    pluralApiName?: string;
    /**
     * A group we want to move the model to.
     */
    group?: string;
    /**
     * A new description of the content model.
     */
    description?: string | null;
    /**
     * A list of content model fields to define the entry values.
     */
    fields: CmsModelFieldInput[];
    /**
     * Admin UI field layout
     *
     * ```ts
     * layout: [
     *      [field1id, field2id],
     *      [field3id]
     * ]
     * ```
     */
    layout: string[][];
    /**
     * Tags for the content model.
     */
    tags?: string[];
    /**
     * Fields fieldId which are picked to represent the CMS entry.
     */
    titleFieldId?: string | null;
    descriptionFieldId?: string | null;
    imageFieldId?: string | null;
}

/**
 * Object containing content model field renderer options.
 *
 * @category CmsModelField
 */
interface CmsModelFieldRenderer {
    /**
     * Name of the field renderer. Must have one in field renderer plugins.
     * Can be blank to let automatically determine the renderer.
     */
    name: string;
    /**
     * Renderer settings allow you to configure field renderer on a field level.
     */
    settings?: GenericRecord<string> | null;
}

/**
 * A definition for content model field settings.
 *
 * @category ModelField
 * @category Database model
 */
export interface CmsModelFieldSettings {
    /**
     * Predefined values (text, number)
     * The default value for the field in case it is not predefined values field.
     */
    defaultValue?: string | boolean | number | null | undefined;
    /**
     * Object field has child fields.
     */
    fields?: CmsModelField[];
    /**
     * Is the file field images only one?
     */
    imagesOnly?: boolean;
    /**
     * Object field has child fields - so it needs to have a layout.
     */
    layout?: string[][];
    /**
     * Ref field.
     */
    models?: Pick<CmsModel, "modelId">[];
    /**
     * Date field.
     */
    type?: string;
    /**
     * Disable full text search explicitly on this field.
     */
    disableFullTextSearch?: boolean;
    /**
     * Dynamic zone field templates.
     */
    templates?: CmsDynamicZoneTemplate[];
    /**
     * There are a lot of other settings that are possible to add, so we keep the type opened.
     */
    [key: string]: any;
}

/**
 * Definition for content model field validator.
 *
 * @category ModelField
 * @category FieldValidation
 */
export interface CmsModelFieldValidation {
    name: string;
    message: string;
    settings?: {
        value?: string | number;
        values?: string[];
        preset?: string;
        [key: string]: any;
    };
}

/**
 * Object containing content model field predefined options and values.
 *
 * @category CmsModelField
 */
export interface CmsModelFieldPredefinedValues {
    /**
     * Are predefined field values enabled?
     */
    enabled: boolean;
    /**
     * Predefined values array.
     */
    values: CmsModelFieldPredefinedValuesValue[];
}

interface CmsModelFieldPredefinedValuesValue {
    value: string;
    label: string;
    /**
     * Default selected predefined value.
     */
    selected?: boolean;
}
