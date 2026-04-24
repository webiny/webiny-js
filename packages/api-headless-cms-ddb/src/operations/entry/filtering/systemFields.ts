import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import {
    ENTRY_META_FIELDS,
    isDateTimeEntryMetaField,
    isIdentityEntryMetaField
} from "@webiny/api-headless-cms/constants.js";
import lodashStartCase from "lodash/startCase.js";
import { createModelField } from "@webiny/api-headless-cms";

export const createSystemFields = (): CmsModelField[] => {
    const onMetaFields = ENTRY_META_FIELDS.filter(isDateTimeEntryMetaField).map<CmsModelField>(
        fieldName => {
            return createModelField({
                id: fieldName,
                type: "datetime",
                storageId: fieldName,
                fieldId: fieldName,
                label: lodashStartCase(fieldName)
            });
        }
    );

    const byMetaFields = ENTRY_META_FIELDS.filter(isIdentityEntryMetaField).map<CmsModelField>(
        fieldName => {
            return createModelField({
                id: fieldName,
                type: "plainObject",
                storageId: fieldName,
                fieldId: fieldName,
                label: lodashStartCase(fieldName),
                settings: {
                    path: `${fieldName}.id`
                }
            });
        }
    );

    return [
        createModelField({
            id: "id",
            type: "text",
            storageId: "id",
            fieldId: "id",
            label: "ID"
        }),
        createModelField({
            id: "entryId",
            type: "text",
            storageId: "entryId",
            fieldId: "entryId",
            label: "Entry ID"
        }),

        ...onMetaFields,
        ...byMetaFields,

        createModelField({
            id: "meta",
            type: "plainObject",
            storageId: "meta",
            fieldId: "meta",
            label: "Meta"
        }),
        createModelField({
            id: "wbyAco_location",
            type: "object",
            storageId: "location",
            label: "Location",
            fieldId: "wbyAco_location",
            settings: {
                fields: [
                    createModelField({
                        id: "folderId",
                        type: "text",
                        fieldId: "folderId",
                        label: "Folder ID",
                        storageId: "folderId",
                        settings: {
                            path: "location.folderId"
                        }
                    })
                ]
            }
        }),

        createModelField({
            id: "version",
            type: "number",
            storageId: "version",
            fieldId: "version",
            label: "Version"
        }),
        createModelField({
            id: "status",
            type: "text",
            storageId: "status",
            fieldId: "status",
            label: "Status"
        }),
        createModelField({
            id: "wbyDeleted",
            type: "boolean",
            storageId: "wbyDeleted",
            fieldId: "wbyDeleted",
            label: "Deleted"
        }),
        createModelField({
            id: "state",
            type: "object",
            storageId: "object@state",
            fieldId: "state",
            label: "State",
            settings: {
                fields: [
                    createModelField({
                        id: "stepId",
                        type: "text",
                        fieldId: "stepId",
                        label: "Step ID",
                        storageId: "stepId"
                    }),
                    createModelField({
                        id: "stepName",
                        type: "text",
                        fieldId: "stepName",
                        label: "Step Name",
                        storageId: "stepName"
                    }),
                    createModelField({
                        id: "state",
                        type: "text",
                        fieldId: "state",
                        label: "State",
                        storageId: "state"
                    })
                ]
            }
        }),
        createModelField({
            id: "values",
            type: "object",
            storageId: "values",
            fieldId: "values",
            label: "Values"
        }),
        createModelField({
            id: "live",
            type: "object",
            storageId: "live",
            fieldId: "live",
            label: "Live",
            settings: {
                fields: [
                    createModelField({
                        id: "version",
                        type: "number",
                        fieldId: "version",
                        label: "Version",
                        storageId: "version"
                    })
                ]
            }
        })
    ];
};
