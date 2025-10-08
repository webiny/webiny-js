import type { Validator } from "@webiny/validation/types.js";
import type { CmsModelFieldValidator } from "~/types/validation.js";
import type {
    CmsDynamicZoneTemplate,
    CmsEditorFieldPredefinedValues,
    CmsModelFieldRendererPlugin
} from "~/types/index.js";
import type { CmsIdentity } from "~/types/shared.js";

/**
 * @deprecated Use `CmsModelField` instead.
 */
export type CmsEditorField<T = unknown> = CmsModelField<T>;

export interface CmsModelFieldSettings<T = unknown> {
    defaultValue?: string | boolean | number | null | undefined;
    defaultSetValue?: string;
    type?: string;
    fields?: CmsModelField<T>[];
    layout?: string[][];
    models?: Pick<CmsModel, "modelId">[];
    templates?: CmsDynamicZoneTemplate[];
    imagesOnly?: boolean;
    [key: string]: any;
}

export type CmsModelField<T = unknown> = T & {
    id: string;
    type: string;
    fieldId: CmsEditorFieldId;
    storageId?: string;
    label: string;
    helpText?: string;
    placeholderText?: string;
    validation?: (CmsModelFieldValidator | Validator)[];
    listValidation?: CmsModelFieldValidator[];
    multipleValues?: boolean;
    predefinedValues?: CmsEditorFieldPredefinedValues;
    settings?: CmsModelFieldSettings<T>;
    renderer:
        | {
              name: string;
              settings?: Record<string, any>;
          }
        /**
         * Use this only for programmatic assignment of renderers.
         * Since functions cannot be serialized, this can only work via code.
         */
        | CmsModelFieldRendererPlugin["renderer"]["render"];
    tags?: string[];
};

export type CmsEditorFieldId = string;
export type CmsEditorFieldsLayout = CmsEditorFieldId[][];

/**
 * @category GraphQL
 * @category Model
 */
export type CmsEditorContentModel = CmsModel;

/**
 * @category GraphQL
 * @category Group
 */
export interface CmsGroup {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description?: string;
    contentModels: CmsModel[];
    createdBy: CmsIdentity;
    /**
     * Tells if this group is a plugin one (cannot be changed/deleted)
     */
    plugin?: boolean;
}

export interface CmsModel {
    id: string;
    group: Pick<CmsGroup, "id" | "name">;
    description?: string;
    version: number;
    layout?: CmsEditorFieldsLayout;
    fields: CmsModelField[];
    lockedFields: CmsModelField[];
    icon: string;
    name: string;
    modelId: string;
    singularApiName: string;
    pluralApiName: string;
    titleFieldId: string | null;
    descriptionFieldId: string | null;
    imageFieldId: string | null;
    status: string;
    savedOn: string;
    meta: any;
    createdBy: CmsIdentity;
    tags: string[];
    /**
     * If model is a plugin one (it cannot be changed/deleted)
     */
    plugin?: boolean;
    /**
     * Is model currently being deleted?
     */
    isBeingDeleted?: boolean;
    settings: {
        [key: string]: any;
    };
}
