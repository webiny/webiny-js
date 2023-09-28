import { createModelField } from "~/utils/createModelField";
import { CmsPrivateModelFull } from "@webiny/api-headless-cms";
import { CmsModelField } from "@webiny/api-headless-cms/types";

export type FilterModelDefinition = Omit<CmsPrivateModelFull, "noValidate" | "group">;

const name = () =>
    createModelField({
        label: "Name",
        fieldId: "name",
        type: "text",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const model = () =>
    createModelField({
        label: "Model",
        fieldId: "model",
        type: "text",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const operation = () =>
    createModelField({
        label: "Operation",
        fieldId: "operation",
        type: "text",
        predefinedValues: {
            enabled: true,
            values: [
                {
                    label: "AND",
                    value: "AND"
                },
                {
                    label: "OR",
                    value: "OR"
                }
            ]
        },
        multipleValues: false,
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const groups = (fields: CmsModelField[]): CmsModelField =>
    createModelField({
        label: "Groups",
        fieldId: "groups",
        type: "object",
        settings: {
            fields,
            layout: fields.map(field => [field.storageId])
        },
        multipleValues: true,
        predefinedValues: {
            values: [],
            enabled: false
        },
        listValidation: [
            {
                name: "minLength",
                message: "Value is too short.",
                settings: {
                    value: "1"
                }
            }
        ]
    });

const filters = (fields: CmsModelField[]): CmsModelField =>
    createModelField({
        label: "Filters",
        fieldId: "filters",
        type: "object",
        settings: {
            fields,
            layout: fields.map(field => [field.storageId])
        },
        multipleValues: true,
        predefinedValues: {
            values: [],
            enabled: false
        },
        listValidation: [
            {
                name: "minLength",
                message: "Value is too short.",
                settings: {
                    value: "1"
                }
            }
        ]
    });

const filterField = () =>
    createModelField({
        label: "Field",
        fieldId: "field",
        type: "text",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const filterCondition = () =>
    createModelField({
        label: "Condition",
        fieldId: "condition",
        type: "text",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const filterValue = () =>
    createModelField({
        label: "Value",
        fieldId: "value",
        type: "text",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

export const FILTER_MODEL_ID = "acoFilter";

export const createFilterModelDefinition = (): FilterModelDefinition => {
    return {
        name: "ACO - Filter",
        modelId: FILTER_MODEL_ID,
        titleFieldId: "name",
        layout: [["name"], ["model"], ["operation"], ["groups"]],
        fields: [
            name(),
            model(),
            operation(),
            groups([operation(), filters([filterField(), filterCondition(), filterValue()])])
        ],
        description: "ACO - Filter content model",
        isPrivate: true
    };
};
