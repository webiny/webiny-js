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
                storageId: "ageStorageId",
                label: "Age"
            },
            {
                id: "title",
                type: "text",
                fieldId: "titleId",
                storageId: "titleStorageId",
                label: "Title"
            },
            {
                id: "date",
                type: "datetime",
                fieldId: "dateId",
                storageId: "dateStorageId",
                label: "Date"
            },
            {
                id: "isMarried",
                type: "boolean",
                fieldId: "isMarriedId",
                storageId: "isMarriedStorageId",
                label: "Is Married"
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
                storageId: "idStorageId",
                label: "Id"
            },
            isSearchable: true,
            isSortable: true,
            isSystemField: true,
            type: "string"
        },
        age: {
            field: {
                id: "age",
                type: "number",
                fieldId: "age",
                storageId: "ageStorageId",
                label: "Age"
            },
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
            type: "number"
        },
        title: {
            field: {
                id: "title",
                type: "text",
                fieldId: "titleId",
                storageId: "titleStorageId",
                label: "Title"
            },
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
            type: "text"
        },
        date: {
            field: {
                id: "date",
                type: "datetime",
                fieldId: "dateId",
                storageId: "dateStorageId",
                label: "Date"
            },
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
            type: "datetime"
        },
        isMarried: {
            field: {
                id: "isMarried",
                type: "boolean",
                fieldId: "isMarriedId",
                storageId: "isMarriedStorageId",
                label: "Is Married"
            },
            isSearchable: true,
            isSortable: true,
            isSystemField: false,
            type: "date"
        }
    };
};
