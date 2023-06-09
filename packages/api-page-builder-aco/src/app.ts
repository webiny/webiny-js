import { IAcoAppRegisterParams } from "@webiny/api-aco/types";
import { PB_PAGE_TYPE } from "~/contants";

export const createApp = (): IAcoAppRegisterParams => {
    return {
        name: PB_PAGE_TYPE,
        apiName: "Pb",
        fields: [
            {
                id: "id",
                fieldId: "id",
                type: "text",
                storageId: "id",
                label: "ID"
            },
            {
                id: "pid",
                fieldId: "pid",
                type: "text",
                storageId: "pid",
                label: "Page ID"
            },
            {
                id: "title",
                fieldId: "title",
                type: "text",
                storageId: "title",
                label: "Title"
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
                id: "savedOn",
                fieldId: "savedOn",
                type: "datetime",
                storageId: "savedOn",
                label: "Saved On"
            },
            {
                id: "status",
                fieldId: "status",
                type: "text",
                storageId: "status",
                label: "Status"
            },
            {
                id: "version",
                fieldId: "version",
                type: "number",
                storageId: "version",
                label: "Version"
            },
            {
                id: "locked",
                fieldId: "locked",
                type: "boolean",
                storageId: "locked",
                label: "Locked"
            },
            {
                id: "path",
                fieldId: "path",
                type: "text",
                storageId: "path",
                label: "Path"
            }
        ]
    };
};
