import { IAcoAppRegisterParams } from "@webiny/api-aco/types";
import { FM_FILE_TYPE } from "~/contants";

export const createApp = (): IAcoAppRegisterParams => {
    return {
        name: FM_FILE_TYPE,
        apiName: "Fm",
        fields: [
            {
                id: "id",
                fieldId: "id",
                type: "text",
                storageId: "id",
                label: "ID"
            },
            {
                id: "key",
                fieldId: "key",
                type: "text",
                storageId: "key",
                label: "Key"
            },
            {
                id: "size",
                fieldId: "size",
                type: "number",
                storageId: "size",
                label: "Size"
            },
            {
                id: "type",
                fieldId: "type",
                type: "text",
                storageId: "type",
                label: "Type"
            },
            {
                id: "name",
                fieldId: "name",
                type: "text",
                storageId: "name",
                label: "Name"
            },
            {
                id: "aliases",
                fieldId: "aliases",
                type: "text",
                storageId: "aliases",
                label: "Aliases",
                multipleValues: true
            },
            {
                id: "createdBy",
                fieldId: "createdBy",
                type: "object",
                storageId: "createdBy",
                label: "Created By",
                settings: {
                    fields: [
                        {
                            id: "id",
                            fieldId: "id",
                            type: "text",
                            storageId: "id",
                            label: "ID"
                        },
                        {
                            id: "displayName",
                            fieldId: "displayName",
                            type: "text",
                            storageId: "displayName",
                            label: "Display Name"
                        },
                        {
                            id: "type",
                            fieldId: "type",
                            type: "text",
                            storageId: "type",
                            label: "Type"
                        }
                    ]
                }
            },
            {
                id: "createdOn",
                fieldId: "createdOn",
                type: "datetime",
                storageId: "createdOn",
                label: "Created On"
            },
            {
                id: "meta",
                fieldId: "meta",
                type: "object",
                storageId: "meta",
                label: "Meta",
                settings: {
                    fields: [
                        {
                            id: "private",
                            fieldId: "private",
                            type: "boolean",
                            storageId: "private",
                            label: "Private"
                        }
                    ]
                }
            }
        ]
    };
};
