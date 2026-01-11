import { z } from "zod";
import type { ModelClass } from "~/models/base/ModelBuilder.js";
import type { BaseModel } from "~/models/base/BaseModel.js";
import type { IModelData } from "~/models/base/abstractions.js";

export interface FieldConfig {
    fieldId: string;
    type: string;
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: ValidationRule[];
    settings?: Record<string, any>;
    zodSchema: z.ZodTypeAny;
    fields?: FieldConfig[]; // For nested object fields
}

export interface ValidationRule {
    name: string;
    message: string;
    settings: Record<string, any>;
}

export interface CmsModelMetadata {
    icon?: string;
    description?: string;
    titleFieldId?: string;
    descriptionFieldId?: string;
    imageFieldId?: string;
    tags?: string[];
}

// Make PrivateCmsModel generic!
export interface PrivateCmsModel<TModel extends BaseModel<any>> {
    type: "private";
    modelType: "private";
    Model: ModelClass<TModel>;
    modelId: string;
    name: string;
    icon?: string;
    description?: string;
    fields: FieldConfig[];
    schema: TModel["__schema"];
    create: (data: IModelData<TModel>) => TModel;
}

export interface FieldBuilderConfig {
    fieldId: string;
    config: FieldConfig;
    zodSchema: z.ZodTypeAny;
}
