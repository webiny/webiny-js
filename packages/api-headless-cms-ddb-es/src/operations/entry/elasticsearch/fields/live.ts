import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";
import { createSystemField } from "./createSystemField.js";
import { createModelField } from "@webiny/api-headless-cms";

export const liveFields: ModelFields = {
    live: {
        type: "object",
        systemField: true,
        searchable: true,
        sortable: false,
        field: createSystemField({
            storageId: "object@live",
            fieldId: "live",
            type: "object",
            settings: {
                fields: [
                    createModelField({
                        id: "version",
                        fieldId: "version",
                        storageId: "number@version",
                        type: "number",
                        label: "Version"
                    })
                ]
            }
        }),
        parents: []
    },
    "live.version": {
        type: "number",
        systemField: true,
        searchable: true,
        sortable: false,
        parents: [
            {
                fieldId: "live",
                type: "object",
                storageId: "object@live"
            }
        ],
        field: createSystemField({
            id: "version",
            fieldId: "version",
            storageId: "number@version",
            type: "number",
            label: "Version"
        })
    }
};
