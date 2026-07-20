import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";
import { createSystemField } from "./createSystemField.js";
import { createModelField } from "@webiny/api-headless-cms";

export const locationFields: ModelFields = {
    wbyAco_location: {
        type: "object",
        systemField: true,
        searchable: true,
        sortable: true,
        field: createSystemField({
            storageId: "location",
            fieldId: "wbyAco_location",
            type: "object",
            settings: {
                fields: [
                    createModelField({
                        id: "folderId",
                        fieldId: "folderId",
                        storageId: "folderId",
                        type: "text",
                        label: "Folder ID"
                    })
                ]
            }
        }),
        parents: []
    },
    "wbyAco_location.folderId": {
        type: "text",
        systemField: true,
        searchable: true,
        sortable: true,
        field: createSystemField({
            id: "folderId",
            fieldId: "folderId",
            storageId: "folderId",
            type: "text",
            label: "Folder ID"
        }),
        parents: [
            {
                fieldId: "wbyAco_location",
                type: "object",
                storageId: "location"
            }
        ]
    }
};
