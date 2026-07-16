import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";
import { createSystemField } from "./createSystemField.js";
import { createModelField } from "@webiny/api-headless-cms";

export const stateFields: ModelFields = {
    state: {
        type: "object",
        systemField: true,
        searchable: true,
        sortable: false,
        field: createSystemField({
            storageId: "object@state",
            fieldId: "state",
            type: "object",
            settings: {
                fields: [
                    createModelField({
                        id: "stepId",
                        fieldId: "stepId",
                        storageId: "text@stepId",
                        type: "text",
                        label: "Step ID"
                    }),
                    createModelField({
                        id: "stepName",
                        fieldId: "stepName",
                        storageId: "text@stepName",
                        type: "text",
                        label: "Step Name"
                    }),
                    createModelField({
                        id: "state",
                        fieldId: "state",
                        storageId: "text@state",
                        type: "text",
                        label: "State"
                    })
                ]
            }
        }),
        parents: []
    },
    "state.stepId": {
        type: "text",
        systemField: true,
        searchable: true,
        sortable: false,
        parents: [
            {
                fieldId: "state",
                type: "object",
                storageId: "object@state"
            }
        ],
        field: createSystemField({
            id: "stepId",
            fieldId: "stepId",
            storageId: "text@stepId",
            type: "text",
            label: "Step ID"
        })
    },
    "state.stepName": {
        type: "text",
        systemField: true,
        searchable: true,
        sortable: false,
        parents: [
            {
                fieldId: "state",
                type: "object",
                storageId: "object@state"
            }
        ],
        field: createSystemField({
            id: "stepName",
            fieldId: "stepName",
            storageId: "text@stepName",
            type: "text",
            label: "Step Name"
        })
    },
    "state.state": {
        type: "text",
        systemField: true,
        searchable: true,
        sortable: false,
        parents: [
            {
                fieldId: "state",
                type: "object",
                storageId: "object@state"
            }
        ],
        field: createSystemField({
            id: "state",
            fieldId: "state",
            storageId: "text@state",
            type: "text",
            label: "State"
        })
    }
};
