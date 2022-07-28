import { CmsModelField } from "@webiny/api-headless-cms/types";

const createSystemField = (field: Partial<CmsModelField>): CmsModelField => {
    return field as CmsModelField;
};

export const systemFields: Record<string, CmsModelField> = {
    id: createSystemField({
        id: "id",
        type: "text",
        fieldId: "id"
    }),
    entryId: createSystemField({
        id: "entryId",
        type: "text",
        fieldId: "entryId"
    }),
    createdOn: createSystemField({
        id: "createdOn",
        type: "datetime",
        fieldId: "createdOn"
    }),
    savedOn: createSystemField({
        id: "savedOn",
        type: "datetime",
        fieldId: "savedOn"
    }),
    createdBy: createSystemField({
        id: "createdBy",
        type: "plainObject",
        fieldId: "createdBy",
        settings: {
            path: "createdBy.id"
        }
    }),
    meta: createSystemField({
        id: "meta",
        type: "plainObject",
        fieldId: "meta"
    }),
    ownedBy: createSystemField({
        id: "ownedBy",
        type: "plainObject",
        fieldId: "ownedBy",
        settings: {
            path: "ownedBy.id"
        }
    }),
    version: createSystemField({
        id: "version",
        type: "number",
        fieldId: "version"
    })
};
