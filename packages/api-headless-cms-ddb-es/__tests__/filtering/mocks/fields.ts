import type { ModelField, ModelFields } from "~/operations/entry/elasticsearch/types";
import type { CmsModel } from "@webiny/api-headless-cms/types";

export interface Fields extends ModelFields {
    id: ModelField;
    "values.age": ModelField;
    "values.title": ModelField;
    "values.date": ModelField;
    "values.isMarried": ModelField;
}

export const createModel = (): CmsModel => {
    return {
        modelId: "testModel",
        name: "Test Model",
        singularApiName: "TestModel",
        pluralApiName: "TestModels",
        fields: [
            {
                id: "age",
                type: "number",
                fieldId: "age",
                storageId: "age",
                label: "Age",
                validation: [],
                listValidation: []
            },
            {
                id: "title",
                type: "text",
                fieldId: "title",
                storageId: "title",
                label: "Title",
                validation: [],
                listValidation: []
            },
            {
                id: "date",
                type: "datetime",
                fieldId: "date",
                storageId: "date",
                label: "Date",
                validation: [],
                listValidation: []
            },
            {
                id: "isMarried",
                type: "boolean",
                fieldId: "isMarried",
                storageId: "isMarried",
                label: "Is Married",
                validation: [],
                listValidation: []
            },
            {
                id: "price",
                type: "number",
                fieldId: "price",
                storageId: "price",
                label: "Price",
                validation: [],
                listValidation: []
            },
            {
                id: "availableOn",
                type: "datetime",
                fieldId: "availableOn",
                storageId: "availableOn",
                label: "Available On",
                validation: [],
                listValidation: []
            }
        ],
        layout: [],
        tenant: "root",
        description: "",
        group: "group",
        titleFieldId: "title"
    };
};

export const createFields = (): Fields => {
    return {
        id: {
            field: {
                id: "id",
                type: "string",
                fieldId: "id",
                storageId: "id",
                label: "Id",
                validation: [],
                listValidation: []
            },
            searchable: true,
            sortable: true,
            systemField: true,
            type: "string",
            parents: []
        },
        "values.age": {
            field: {
                id: "age",
                type: "number",
                fieldId: "age",
                storageId: "age",
                label: "Age",
                validation: [],
                listValidation: []
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "number",
            parents: [
                {
                    fieldId: "values",
                    type: "object",
                    storageId: "values"
                }
            ]
        },
        "values.title": {
            field: {
                id: "title",
                type: "text",
                fieldId: "title",
                storageId: "title",
                label: "Title",
                validation: [],
                listValidation: []
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "text",
            parents: [
                {
                    fieldId: "values",
                    type: "object",
                    storageId: "values"
                }
            ]
        },
        "values.date": {
            field: {
                id: "date",
                type: "datetime",
                fieldId: "date",
                storageId: "date",
                label: "Date",
                validation: [],
                listValidation: []
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "datetime",
            parents: [
                {
                    fieldId: "values",
                    type: "object",
                    storageId: "values"
                }
            ]
        },
        "values.isMarried": {
            field: {
                id: "isMarried",
                type: "boolean",
                fieldId: "isMarried",
                storageId: "isMarried",
                label: "Is Married",
                validation: [],
                listValidation: []
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "date",
            parents: [
                {
                    fieldId: "values",
                    type: "object",
                    storageId: "values"
                }
            ]
        },
        "values.price": {
            field: {
                id: "price",
                type: "number",
                fieldId: "price",
                storageId: "price",
                label: "Price",
                validation: [],
                listValidation: []
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "number",
            parents: [
                {
                    fieldId: "values",
                    type: "object",
                    storageId: "values"
                }
            ]
        },
        "values.availableOn": {
            field: {
                id: "availableOn",
                type: "datetime",
                fieldId: "availableOn",
                storageId: "availableOn",
                label: "Available On",
                validation: [],
                listValidation: []
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "date",
            parents: [
                {
                    fieldId: "values",
                    type: "object",
                    storageId: "values"
                }
            ]
        }
    };
};
