import { createModelField } from "~/utils/createModelField";
import { CmsPrivateModelFull } from "@webiny/api-headless-cms";

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

const mainOperation = () =>
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

const groups = () =>
    createModelField({
        label: "Groups",
        fieldId: "groups",
        type: "object",
        settings: {
            fields: [groupOperation(), filters()],
            layout: [["operation"], ["filters"]]
        },
        multipleValues: true,
        listValidation: [
            {
                name: "minLength",
                settings: {
                    value: "1"
                },
                message: "Value is too short."
            }
        ]
    });

const groupOperation = () =>
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

const filters = () =>
    createModelField({
        label: "Filters",
        fieldId: "filters",
        type: "object",
        settings: {
            fields: [filterField(), filterCondition(), filterValue()],
            layout: [["field"], ["condition"], ["value"]]
        },
        multipleValues: true,
        listValidation: [
            {
                name: "minLength",
                settings: {
                    value: "1"
                },
                message: "Value is too short."
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
        layout: [["name"], ["operation"], ["groups"]],
        fields: [name(), mainOperation(), groups()],
        description: "ACO - Filter content model",
        isPrivate: true
    };
};
