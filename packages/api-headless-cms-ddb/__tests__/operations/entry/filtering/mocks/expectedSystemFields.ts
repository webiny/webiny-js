import { expect } from "vitest";
import type { Field } from "../types.js";

export const expectedSystemFields: Record<string, Field> = {
    id: {
        id: "id",
        storageId: "id",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "id",
        label: "ID",
        type: "text",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    entryId: {
        id: "entryId",
        storageId: "entryId",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "entryId",
        label: "Entry ID",
        type: "text",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    createdOn: {
        id: "createdOn",
        storageId: "createdOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "createdOn",
        label: "Created On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    modifiedOn: {
        id: "modifiedOn",
        storageId: "modifiedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "modifiedOn",
        label: "Modified On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    savedOn: {
        id: "savedOn",
        storageId: "savedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "savedOn",
        label: "Saved On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    deletedOn: {
        id: "deletedOn",
        storageId: "deletedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "deletedOn",
        label: "Deleted On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    restoredOn: {
        id: "restoredOn",
        storageId: "restoredOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "restoredOn",
        label: "Restored On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    firstPublishedOn: {
        id: "firstPublishedOn",
        storageId: "firstPublishedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "firstPublishedOn",
        label: "First Published On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    lastPublishedOn: {
        id: "lastPublishedOn",
        storageId: "lastPublishedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "lastPublishedOn",
        label: "Last Published On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionCreatedOn: {
        id: "revisionCreatedOn",
        storageId: "revisionCreatedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionCreatedOn",
        label: "Revision Created On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionModifiedOn: {
        id: "revisionModifiedOn",
        storageId: "revisionModifiedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionModifiedOn",
        label: "Revision Modified On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionSavedOn: {
        id: "revisionSavedOn",
        storageId: "revisionSavedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionSavedOn",
        label: "Revision Saved On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionDeletedOn: {
        id: "revisionDeletedOn",
        storageId: "revisionDeletedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionDeletedOn",
        label: "Revision Deleted On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionRestoredOn: {
        id: "revisionRestoredOn",
        storageId: "revisionRestoredOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionRestoredOn",
        label: "Revision Restored On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionFirstPublishedOn: {
        id: "revisionFirstPublishedOn",
        storageId: "revisionFirstPublishedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionFirstPublishedOn",
        label: "Revision First Published On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionLastPublishedOn: {
        id: "revisionLastPublishedOn",
        storageId: "revisionLastPublishedOn",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionLastPublishedOn",
        label: "Revision Last Published On",
        type: "datetime",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    createdBy: {
        id: "createdBy",
        storageId: "createdBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "createdBy",
        label: "Created By",
        type: "plainObject",
        settings: {
            path: "createdBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    modifiedBy: {
        id: "modifiedBy",
        storageId: "modifiedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "modifiedBy",
        label: "Modified By",
        type: "plainObject",
        settings: {
            path: "modifiedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    savedBy: {
        id: "savedBy",
        storageId: "savedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "savedBy",
        label: "Saved By",
        type: "plainObject",
        settings: {
            path: "savedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    deletedBy: {
        id: "deletedBy",
        storageId: "deletedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "deletedBy",
        label: "Deleted By",
        type: "plainObject",
        settings: {
            path: "deletedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    restoredBy: {
        id: "restoredBy",
        storageId: "restoredBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "restoredBy",
        label: "Restored By",
        type: "plainObject",
        settings: {
            path: "restoredBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    firstPublishedBy: {
        id: "firstPublishedBy",
        storageId: "firstPublishedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "firstPublishedBy",
        label: "First Published By",
        type: "plainObject",
        settings: {
            path: "firstPublishedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    lastPublishedBy: {
        id: "lastPublishedBy",
        storageId: "lastPublishedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "lastPublishedBy",
        label: "Last Published By",
        type: "plainObject",
        settings: {
            path: "lastPublishedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionCreatedBy: {
        id: "revisionCreatedBy",
        storageId: "revisionCreatedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionCreatedBy",
        label: "Revision Created By",
        type: "plainObject",
        settings: {
            path: "revisionCreatedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionModifiedBy: {
        id: "revisionModifiedBy",
        storageId: "revisionModifiedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionModifiedBy",
        label: "Revision Modified By",
        type: "plainObject",
        settings: {
            path: "revisionModifiedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionSavedBy: {
        id: "revisionSavedBy",
        storageId: "revisionSavedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionSavedBy",
        label: "Revision Saved By",
        type: "plainObject",
        settings: {
            path: "revisionSavedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionDeletedBy: {
        id: "revisionDeletedBy",
        storageId: "revisionDeletedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionDeletedBy",
        label: "Revision Deleted By",
        type: "plainObject",
        settings: {
            path: "revisionDeletedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionRestoredBy: {
        id: "revisionRestoredBy",
        storageId: "revisionRestoredBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionRestoredBy",
        label: "Revision Restored By",
        type: "plainObject",
        settings: {
            path: "revisionRestoredBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionFirstPublishedBy: {
        id: "revisionFirstPublishedBy",
        storageId: "revisionFirstPublishedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionFirstPublishedBy",
        label: "Revision First Published By",
        type: "plainObject",
        settings: {
            path: "revisionFirstPublishedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    revisionLastPublishedBy: {
        id: "revisionLastPublishedBy",
        storageId: "revisionLastPublishedBy",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "revisionLastPublishedBy",
        label: "Revision Last Published By",
        type: "plainObject",
        settings: {
            path: "revisionLastPublishedBy.id"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    meta: {
        id: "meta",
        storageId: "meta",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "meta",
        label: "Meta",
        type: "plainObject",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    wbyAco_location: {
        id: "wbyAco_location",
        storageId: "location",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "wbyAco_location",
        label: "Location",
        type: "object",
        settings: {
            fields: [
                {
                    id: "folderId",
                    storageId: "folderId",
                    fieldId: "folderId",
                    label: "Folder ID",
                    type: "text",
                    settings: {
                        path: "location.folderId"
                    },
                    listValidation: [],
                    validation: [],
                    list: false,
                    predefinedValues: {
                        values: [],
                        enabled: false
                    },
                    help: null,
                    placeholder: null,
                    renderer: null
                }
            ]
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    "wbyAco_location.folderId": {
        id: "folderId",
        storageId: "folderId",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "folderId",
        label: "Folder ID",
        type: "text",
        settings: {
            path: "location.folderId"
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [
            {
                fieldId: "wbyAco_location",
                list: false
            }
        ],
        system: true
    },
    version: {
        id: "version",
        storageId: "version",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "version",
        label: "Version",
        type: "number",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    status: {
        id: "status",
        storageId: "status",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "status",
        label: "Status",
        type: "text",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    wbyDeleted: {
        id: "wbyDeleted",
        storageId: "wbyDeleted",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "wbyDeleted",
        label: "Deleted",
        type: "boolean",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    state: {
        id: "state",
        storageId: "object@state",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "state",
        label: "State",
        type: "object",
        settings: {
            fields: [
                {
                    id: "stepId",
                    storageId: "stepId",
                    fieldId: "stepId",
                    label: "Step ID",
                    type: "text",
                    settings: {},
                    listValidation: [],
                    validation: [],
                    list: false,
                    predefinedValues: {
                        values: [],
                        enabled: false
                    },
                    help: null,
                    placeholder: null,
                    renderer: null
                },
                {
                    id: "stepName",
                    storageId: "stepName",
                    fieldId: "stepName",
                    label: "Step Name",
                    type: "text",
                    settings: {},
                    listValidation: [],
                    validation: [],
                    list: false,
                    predefinedValues: {
                        values: [],
                        enabled: false
                    },
                    help: null,
                    placeholder: null,
                    renderer: null
                },
                {
                    id: "state",
                    storageId: "state",
                    fieldId: "state",
                    label: "State",
                    type: "text",
                    settings: {},
                    listValidation: [],
                    validation: [],
                    list: false,
                    predefinedValues: {
                        values: [],
                        enabled: false
                    },
                    help: null,
                    placeholder: null,
                    renderer: null
                }
            ]
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    "state.stepId": {
        id: "stepId",
        storageId: "stepId",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "stepId",
        label: "Step ID",
        type: "text",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [
            {
                fieldId: "state",
                list: false
            }
        ],
        system: true
    },
    "state.stepName": {
        id: "stepName",
        storageId: "stepName",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "stepName",
        label: "Step Name",
        type: "text",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [
            {
                fieldId: "state",
                list: false
            }
        ],
        system: true
    },
    "state.state": {
        id: "state",
        storageId: "state",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "state",
        label: "State",
        type: "text",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [
            {
                fieldId: "state",
                list: false
            }
        ],
        system: true
    },
    live: {
        id: "live",
        storageId: "live",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "live",
        label: "Live",
        type: "object",
        settings: {
            fields: [
                {
                    id: "version",
                    storageId: "number@version",
                    fieldId: "version",
                    label: "Version",
                    type: "number",
                    settings: {},
                    listValidation: [],
                    validation: [],
                    list: false,
                    predefinedValues: {
                        values: [],
                        enabled: false
                    },
                    help: null,
                    placeholder: null,
                    renderer: null
                }
            ]
        },
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    },
    "live.version": {
        id: "version",
        storageId: "number@version",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "version",
        label: "Version",
        type: "number",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [
            {
                fieldId: "live",
                list: false
            }
        ],
        system: true
    },
    values: {
        id: "values",
        storageId: "values",
        createPath: expect.any(Function),
        transform: expect.any(Function),
        fieldId: "values",
        label: "Values",
        type: "object",
        settings: {},
        listValidation: [],
        validation: [],
        list: false,
        predefinedValues: {
            values: [],
            enabled: false
        },
        help: null,
        placeholder: null,
        renderer: null,
        parents: [],
        system: true
    }
};
