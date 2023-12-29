import { CmsModelField } from "@webiny/api-headless-cms/types";
import {
    ENTRY_META_FIELDS,
    isDateTimeEntryMetaField,
    isIdentityEntryMetaField
} from "@webiny/api-headless-cms/constants";
import lodashStartCase from "lodash/startCase";

type Field = Pick<CmsModelField, "id" | "type" | "storageId" | "fieldId" | "settings" | "label">;

export const createSystemFields = (): Field[] => {
    const onMetaFields = ENTRY_META_FIELDS.filter(isDateTimeEntryMetaField).map(fieldName => {
        return {
            id: fieldName,
            type: "datetime",
            storageId: fieldName,
            fieldId: fieldName,
            label: lodashStartCase(fieldName)
        };
    });

    const byMetaFields = ENTRY_META_FIELDS.filter(isIdentityEntryMetaField).map(fieldName => {
        return {
            id: fieldName,
            type: "plainObject",
            storageId: fieldName,
            fieldId: fieldName,
            label: lodashStartCase(fieldName),
            settings: {
                path: `${fieldName}.id`
            }
        };
    });

    return [
        {
            id: "id",
            type: "text",
            storageId: "id",
            fieldId: "id",
            label: "ID"
        },
        {
            id: "entryId",
            type: "text",
            storageId: "entryId",
            fieldId: "entryId",
            label: "Entry ID"
        },
        /**
         * 🚫 Deprecated meta fields below.
         * Will be fully removed in one of the next releases.
         */
        {
            id: "createdOn",
            type: "datetime",
            storageId: "createdOn",
            fieldId: "createdOn",
            label: "Created On"
        },
        {
            id: "savedOn",
            type: "datetime",
            storageId: "savedOn",
            fieldId: "savedOn",
            label: "Saved On"
        },
        {
            id: "createdBy",
            type: "plainObject",
            storageId: "createdBy",
            fieldId: "createdBy",
            label: "Created By",
            settings: {
                path: "createdBy.id"
            }
        },
        {
            id: "ownedBy",
            type: "plainObject",
            storageId: "ownedBy",
            fieldId: "ownedBy",
            label: "Owned By",
            settings: {
                path: "ownedBy.id"
            }
        },

        /**
         * 🆕 New meta fields below.
         * Users are encouraged to use these instead of the deprecated ones above.
         */
        ...onMetaFields,
        ...byMetaFields,

        {
            id: "meta",
            type: "plainObject",
            storageId: "meta",
            fieldId: "meta",
            label: "Meta"
        },
        {
            id: "wbyAco_location",
            type: "object",
            storageId: "location",
            label: "Location",
            fieldId: "wbyAco_location",
            settings: {
                fields: [
                    {
                        id: "folderId",
                        type: "text",
                        fieldId: "folderId",
                        label: "Folder ID",
                        storageId: "folderId",
                        settings: {
                            path: "location.folderId"
                        }
                    }
                ]
            }
        },

        {
            id: "version",
            type: "number",
            storageId: "version",
            fieldId: "version",
            label: "Version"
        },
        {
            id: "status",
            type: "text",
            storageId: "status",
            fieldId: "status",
            label: "Status"
        }
    ];
};
