export interface CreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export interface CmsGroup {
    id: string;
    name: string;
    createdOn: Date;
    savedOn: Date;
    contentModels: CmsModel[];
    totalContentModels: number;
    slug: string;
    description: string;
    icon: string;
    createdBy: CreatedBy;
    plugin: boolean;
}

export interface CmsModelFieldPredefinedValue {
    label: string;
    value: string;
}

export interface CmsModelFieldPredefinedValues {
    enabled: boolean;
    values: CmsModelFieldPredefinedValue[];
}

export interface CmsModelFieldValidation {
    name: string;
    message: string;
    settings: Record<string, any>;
}

export interface CmsContentModelCreateInput {
    name: string;
    modelId: string;
    group: string;
    description: string;
}

export interface CmsPredefinedValueInput {
    label: string;
    value: string;
}

export interface CmsPredefinedValuesInput {
    enabled: boolean;
    values: CmsPredefinedValueInput[];
}
export interface CmsFieldRendererInput {
    name: string;
}

export interface CmsFieldValidationInput {
    name: string;
    message: string;
    settings: Record<string, any>;
}

export interface CmsContentModelFieldInput {
    id: string;
    label: string;
    helpText: string;
    placeholderText: string;
    fieldId: string;
    type: string;
    multipleValues: boolean;
    predefinedValues: CmsPredefinedValuesInput;
    renderer: CmsFieldRendererInput;
    validation: CmsFieldValidationInput[];
    listValidation: CmsFieldValidationInput[];
    settings: Record<string, any>;
}

export interface CmsContentModelUpdateInput {
    name: string;
    group: string;
    description: string;
    layout: string[][];
    fields: CmsContentModelFieldInput[];
    titleFieldId: string;
}

export interface CmsModelField {
    id: string;
    fieldId: string;
    label: string;
    helpText: string;
    placeholderText: string;
    type: string;
    multipleValues: boolean;
    predefinedValues: CmsModelFieldPredefinedValues;
    renderer: {
        name: string;
    };
    validation: CmsModelFieldValidation[];
    listValidation: CmsModelFieldValidation[];
    settings: Record<string, any>;
}

export interface CmsModel {
    name: string;
    modelId: string;
    description: string;
    group: CmsGroup;
    createdOn: Date;
    savedOn: Date;
    createdBy: CreatedBy;
    fields: CmsModelField[];
    lockedFields: any[];
    layout: string[][];
    titleFieldId: string;
    plugin: boolean;
}

export interface CmsModelCreateInput {
    name: string;
    modelId: string;
    group: string;
    description: string;
}

export interface CmsGroupCreateInput {
    name: string;
    slug: string;
    description: string;
    icon: string;
}

export interface CmsEntry {
    id: string;
    entryId: string;
}
