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
            isSearchable: true,
            isSortable: true,
            isSystemField: true,
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
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
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
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
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
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
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
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
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
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
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
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
            type: "date",
            parents: []
        }
    };
};
