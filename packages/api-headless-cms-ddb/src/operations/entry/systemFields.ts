import { CmsModelField } from "@webiny/api-headless-cms/types";

type CmsModelFieldInput = Partial<CmsModelField> &
    Pick<CmsModelField, "id" | "type" | "fieldId" | "alias">;
const createSystemField = (field: CmsModelFieldInput): CmsModelField => {
    return field as CmsModelField;
};

export const systemFields: Record<string, CmsModelField> = {
    id: createSystemField({
        id: "id",
        type: "text",
        fieldId: "id",
        alias: "id"
    }),
    entryId: createSystemField({
        id: "entryId",
        type: "text",
        fieldId: "entryId",
        alias: "entryId"
    }),
    createdOn: createSystemField({
        id: "createdOn",
        type: "datetime",
        fieldId: "createdOn",
        alias: "createdOn"
    }),
    savedOn: createSystemField({
        id: "savedOn",
        type: "datetime",
        fieldId: "savedOn",
        alias: "savedOn"
    }),
    createdBy: createSystemField({
        id: "createdBy",
        type: "plainObject",
        fieldId: "createdBy",
        alias: "createdBy",
        settings: {
            path: "createdBy.id"
        }
    }),
    meta: createSystemField({
        id: "meta",
        type: "plainObject",
        fieldId: "meta",
        alias: "meta"
    }),
    ownedBy: createSystemField({
        id: "ownedBy",
        type: "plainObject",
        fieldId: "ownedBy",
        alias: "ownedBy",
        settings: {
            path: "ownedBy.id"
        }
    }),
    version: createSystemField({
        id: "version",
        type: "number",
        fieldId: "version",
        alias: "version"
    })
};
