import { createModelField } from "~/utils/createModelField";
import { createPrivateModelDefinition } from "@webiny/api-headless-cms";
import { CmsModelField } from "@webiny/api-headless-cms/types";

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

const description = () =>
    createModelField({
        label: "Description",
        fieldId: "description",
        type: "text"
    });

const namespace = () =>
    createModelField({
        label: "Model Id",
        fieldId: "namespace",
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

const groups = (fields: CmsModelField[]) =>
    createModelField({
        label: "Groups",
        fieldId: "groups",
        type: "object",
        multipleValues: true,
        settings: {
            fields,
            layout: fields.map(field => [field.storageId])
        },
        listValidation: [
            {
                name: "minLength",
                message: "At least one group is required.",
                settings: {
                    value: "1"
                }
            }
        ]
    });

const filters = (fields: CmsModelField[]) =>
    createModelField({
        label: "Filters",
        fieldId: "filters",
        type: "object",
        multipleValues: true,
        settings: {
            fields,
            layout: fields.map(field => [field.storageId])
        },
        listValidation: [
            {
                name: "minLength",
                message: "At least one filter is required.",
                settings: {
                    value: "1"
                }
            }
        ]
    });

const field = () =>
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

const condition = () =>
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

const value = () =>
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

export const createFilterModelDefinition = () => {
    return createPrivateModelDefinition({
        name: "ACO - Filter",
        modelId: FILTER_MODEL_ID,
        titleFieldId: "name",

        // We fully disable authorization checks for this model (both base and FLP).
        authorization: false,

        fields: [
            name(),
            description(),
            namespace(),
            operation(),
            groups([operation(), filters([field(), condition(), value()])])
        ]
    });
};
