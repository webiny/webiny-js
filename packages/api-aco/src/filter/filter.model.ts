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

const groups = () =>
    createModelField({
        label: "Groups",
        fieldId: "groups",
        type: "wby-aco-json",
        multipleValues: true,
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

export const FILTER_MODEL_ID = "acoFilter";

export const createFilterModelDefinition = (): FilterModelDefinition => {
    return {
        name: "ACO - Filter",
        modelId: FILTER_MODEL_ID,
        titleFieldId: "name",
        layout: [["name"], ["description"], ["namespace"], ["operation"], ["groups"]],
        fields: [name(), description(), namespace(), operation(), groups()],
        description: "ACO - Filter content model",
        isPrivate: true
    };
};
