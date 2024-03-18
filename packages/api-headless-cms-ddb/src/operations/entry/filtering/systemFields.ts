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
        },
        {
            id: "deleted",
            type: "boolean",
            storageId: "deleted",
            fieldId: "deleted",
            label: "Deleted"
        }
    ];
};
