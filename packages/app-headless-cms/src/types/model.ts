import { CmsModelFieldValidator } from "~/types/validation";
import { CmsDynamicZoneTemplate, CmsEditorFieldPredefinedValues } from "~/types/index";
import { CmsCreatedBy } from "~/types/shared";

/**
 * @deprecated Use `CmsModelField` instead.
 */
export type CmsEditorField<T = unknown> = CmsModelField<T>;

export type CmsModelField<T = unknown> = T & {
    id: string;
    type: string;
    fieldId: CmsEditorFieldId;
    storageId?: string;
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: CmsModelFieldValidator[];
    listValidation?: CmsModelFieldValidator[];
    multipleValues?: boolean;
    predefinedValues?: CmsEditorFieldPredefinedValues;
    settings?: {
        defaultValue?: string | null | undefined;
        defaultSetValue?: string;
        type?: string;
        fields?: CmsModelField<any>[];
        layout?: string[][];
        models?: Pick<CmsModel, "modelId" | "name">[];
        templates?: CmsDynamicZoneTemplate[];
        imagesOnly?: boolean;
        [key: string]: any;
    };
    renderer: {
        name: string;
    };
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
    icon?: string;
    description?: string;
    contentModels: CmsModel[];
    createdBy: CmsCreatedBy;
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
    name: string;
    modelId: string;
    titleFieldId: string;
    descriptionFieldId: string;
    settings: {
        [key: string]: any;
    };
    status: string;
    savedOn: string;
    meta: any;
    createdBy: CmsCreatedBy;
    tags: string[];
    /**
     * If model is a plugin one (it cannot be changed/deleted)
     */
    plugin?: boolean;
}
