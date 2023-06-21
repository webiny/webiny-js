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
                storageId: "text@id",
                label: "ID"
            },
            {
                id: "pid",
                fieldId: "pid",
                type: "text",
                storageId: "text@pid",
                label: "Page ID"
            },
            {
                id: "title",
                fieldId: "title",
                type: "text",
                storageId: "text@title",
                label: "Title"
            },
            {
                id: "createdBy",
                fieldId: "createdBy",
                type: "object",
                storageId: "object@createdBy",
                label: "Created By",
                settings: {
                    fields: [
                        {
                            id: "id",
                            fieldId: "id",
                            type: "text",
                            storageId: "text@id",
                            label: "ID"
                        },
                        {
                            id: "displayName",
                            fieldId: "displayName",
                            type: "text",
                            storageId: "text@displayName",
                            label: "Display Name"
                        },
                        {
                            id: "type",
                            fieldId: "type",
                            type: "text",
                            storageId: "text@type",
                            label: "Type"
                        }
                    ]
                }
            },
            {
                id: "createdOn",
                fieldId: "createdOn",
                type: "datetime",
                storageId: "datetime@createdOn",
                label: "Created On"
            },
            {
                id: "savedOn",
                fieldId: "savedOn",
                type: "datetime",
                storageId: "datetime@savedOn",
                label: "Saved On"
            },
            {
                id: "status",
                fieldId: "status",
                type: "text",
                storageId: "text@status",
                label: "Status"
            },
            {
                id: "version",
                fieldId: "version",
                type: "number",
                storageId: "number@version",
                label: "Version"
            },
            {
                id: "locked",
                fieldId: "locked",
                type: "boolean",
                storageId: "boolean@locked",
                label: "Locked"
            },
            {
                id: "path",
                fieldId: "path",
                type: "text",
                storageId: "text@path",
                label: "Path"
            }
        ]
    };
};
