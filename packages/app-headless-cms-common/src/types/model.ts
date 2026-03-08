import type { Validator } from "@webiny/validation/types.js";
import type { CmsModelFieldValidator } from "~/types/validation.js";
import type {
    CmsDynamicZoneTemplate,
    CmsEditorFieldPredefinedValues,
    CmsModelFieldRendererPlugin
} from "~/types/index.js";
import type { CmsIdentity } from "~/types/shared.js";
import type React from "react";

export interface CmsModelFieldSettings<T = unknown> {
    defaultValue?: string | boolean | number | null | undefined;
    defaultSetValue?: string;
    type?: string;
    fields?: CmsModelField<T>[];
    layout?: CmsEditorFieldsLayout;
    models?: Pick<CmsModel, "modelId">[];
    templates?: CmsDynamicZoneTemplate[];
    imagesOnly?: boolean;
    [key: string]: any;
}

export type FieldRuleAction = "hide" | "disable" | string;

export interface FieldRule {
    type: "accessControl" | "condition";
    target: string;
    operator: string;
    value: string | number | boolean | null;
    action: FieldRuleAction;
}

export type CmsModelField<T = unknown> = T & {
    id: string;
    type: string;
    fieldId: CmsEditorFieldId;
    storageId?: string;
    label: string;
    help?: string | React.ReactNode;
    description?: string | React.ReactNode;
    note?: string | React.ReactNode;
    placeholder?: string;
    validation?: (CmsModelFieldValidator | Validator)[];
    listValidation?: CmsModelFieldValidator[];
    list?: boolean;
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
    rules?: FieldRule[];
};

export type CmsEditorFieldId = string;

export interface CmsModelLayoutField {
    id: string;
    type: string;
    rules?: FieldRule[];
}

export interface CmsSeparatorLayoutField extends CmsModelLayoutField {
    type: "separator";
    label: string;
    description?: string;
}

export interface CmsAlertLayoutField extends CmsModelLayoutField {
    type: "alert";
    label: string;
    alertType: "info" | "success" | "warning" | "danger";
}

export interface CmsTabLayoutTab {
    id: string;
    label: string;
    icon?: string;
    layout: CmsEditorFieldsLayout;
    rules?: FieldRule[];
}

export interface CmsTabLayoutField extends CmsModelLayoutField {
    type: "tabs";
    label: string;
    description?: string | null;
    help?: string | null;
    tabs: CmsTabLayoutTab[];
}

export type CmsLayoutField =
    | CmsSeparatorLayoutField
    | CmsAlertLayoutField
    | CmsTabLayoutField
    | CmsModelLayoutField;

export type CmsEditorLayoutCell = CmsEditorFieldId | CmsLayoutField;
export type CmsEditorFieldsLayout = CmsEditorLayoutCell[][];

/**
 * Distinguish layout fields from field IDs (strings) and CmsModelField objects.
 *
 * In raw layout data (`CmsEditorFieldsLayout`), cells are either strings (field IDs)
 * or layout field objects — the `typeof` check handles that.
 *
 * In resolved layout data (after `getFieldsInLayout`), cells are either `CmsModelField`
 * or layout field objects — both have `{ id, type }`, but only `CmsModelField`
 * has `fieldId`, so we use its absence as the discriminator.
 */
export function isLayoutField(cell: unknown): cell is CmsLayoutField {
    return (
        typeof cell === "object" &&
        cell !== null &&
        "type" in cell &&
        typeof (cell as any).type === "string" &&
        !("fieldId" in cell)
    );
}

/**
 * @deprecated Use `isLayoutField` instead.
 */
export const isLayoutDescriptor = isLayoutField;

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
    group: string;
    description?: string;
    version: number;
    layout?: CmsEditorFieldsLayout;
    fields: CmsModelField[];
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
