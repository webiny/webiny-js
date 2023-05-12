import { ModelField, ModelFields } from "~/operations/entry/elasticsearch/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface Fields extends ModelFields {
    id: ModelField;
    age: ModelField;
    title: ModelField;
    date: ModelField;
    isMarried: ModelField;
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
                label: "Age"
            },
            {
                id: "title",
                type: "text",
                fieldId: "title",
                storageId: "title",
                label: "Title"
            },
            {
                id: "date",
                type: "datetime",
                fieldId: "date",
                storageId: "date",
                label: "Date"
            },
            {
                id: "isMarried",
                type: "boolean",
                fieldId: "isMarried",
                storageId: "isMarried",
                label: "Is Married"
            },
            {
                id: "price",
                type: "number",
                fieldId: "price",
                storageId: "price",
                label: "Price"
            },
            {
                id: "availableOn",
                type: "datetime",
                fieldId: "availableOn",
                storageId: "availableOn",
                label: "Available On"
            }
        ],
        layout: [],
        locale: "en-US",
        tenant: "root",
        description: "",
        group: {
            id: "group",
            name: "Group"
        },
        titleFieldId: "title",
        webinyVersion: "x.x.x"
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
                label: "Id"
            },
            searchable: true,
            sortable: true,
            systemField: true,
            type: "string",
            parents: []
        },
        age: {
            field: {
                id: "age",
                type: "number",
                fieldId: "age",
                storageId: "age",
                label: "Age"
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "number",
            parents: []
        },
        title: {
            field: {
                id: "title",
                type: "text",
                fieldId: "title",
                storageId: "title",
                label: "Title"
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "text",
            parents: []
        },
        date: {
            field: {
                id: "date",
                type: "datetime",
                fieldId: "date",
                storageId: "date",
                label: "Date"
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "datetime",
            parents: []
        },
        isMarried: {
            field: {
                id: "isMarried",
                type: "boolean",
                fieldId: "isMarried",
                storageId: "isMarried",
                label: "Is Married"
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "date",
            parents: []
        },
        price: {
            field: {
                id: "price",
                type: "number",
                fieldId: "price",
                storageId: "price",
                label: "Price"
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "number",
            parents: []
        },
        availableOn: {
            field: {
                id: "availableOn",
                type: "datetime",
                fieldId: "availableOn",
                storageId: "availableOn",
                label: "Available On"
            },
            searchable: true,
            sortable: true,
            systemField: false,
            type: "date",
            parents: []
        }
    };
};
