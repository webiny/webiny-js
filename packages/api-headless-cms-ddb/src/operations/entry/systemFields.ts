import { CmsModelField } from "@webiny/api-headless-cms/types";

type CmsModelFieldInput = Partial<CmsModelField> &
    Pick<CmsModelField, "id" | "type" | "storageId" | "fieldId">;
const createSystemField = (field: CmsModelFieldInput): CmsModelField => {
    return field as CmsModelField;
};

export const systemFields: Record<string, CmsModelField> = {
    id: createSystemField({
        id: "id",
        type: "text",
        storageId: "id",
        fieldId: "id"
    }),
    entryId: createSystemField({
        id: "entryId",
        type: "text",
        storageId: "entryId",
        fieldId: "entryId"
    }),
    createdOn: createSystemField({
        id: "createdOn",
        type: "datetime",
        storageId: "createdOn",
        fieldId: "createdOn"
    }),
    savedOn: createSystemField({
        id: "savedOn",
        type: "datetime",
        storageId: "savedOn",
        fieldId: "savedOn"
    }),
    createdBy: createSystemField({
        id: "createdBy",
        type: "plainObject",
        storageId: "createdBy",
        fieldId: "createdBy",
        settings: {
            path: "createdBy.id"
        }
    }),
    meta: createSystemField({
        id: "meta",
        type: "plainObject",
        storageId: "meta",
        fieldId: "meta"
    }),
    ownedBy: createSystemField({
        id: "ownedBy",
        type: "plainObject",
        storageId: "ownedBy",
        fieldId: "ownedBy",
        settings: {
            path: "ownedBy.id"
        }
    }),
    version: createSystemField({
        id: "version",
        type: "number",
        storageId: "version",
        fieldId: "version"
    })
};
