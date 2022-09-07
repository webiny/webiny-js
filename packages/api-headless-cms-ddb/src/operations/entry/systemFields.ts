import { CmsModelField } from "@webiny/api-headless-cms/types";

type CmsModelFieldInput = Partial<CmsModelField> &
    Pick<CmsModelField, "id" | "type" | "storageId" | "alias">;
const createSystemField = (field: CmsModelFieldInput): CmsModelField => {
    return field as CmsModelField;
};

export const systemFields: Record<string, CmsModelField> = {
    id: createSystemField({
        id: "id",
        type: "text",
        storageId: "id",
        alias: "id"
    }),
    entryId: createSystemField({
        id: "entryId",
        type: "text",
        storageId: "entryId",
        alias: "entryId"
    }),
    createdOn: createSystemField({
        id: "createdOn",
        type: "datetime",
        storageId: "createdOn",
        alias: "createdOn"
    }),
    savedOn: createSystemField({
        id: "savedOn",
        type: "datetime",
        storageId: "savedOn",
        alias: "savedOn"
    }),
    createdBy: createSystemField({
        id: "createdBy",
        type: "plainObject",
        storageId: "createdBy",
        alias: "createdBy",
        settings: {
            path: "createdBy.id"
        }
    }),
    meta: createSystemField({
        id: "meta",
        type: "plainObject",
        storageId: "meta",
        alias: "meta"
    }),
    ownedBy: createSystemField({
        id: "ownedBy",
        type: "plainObject",
        storageId: "ownedBy",
        alias: "ownedBy",
        settings: {
            path: "ownedBy.id"
        }
    }),
    version: createSystemField({
        id: "version",
        type: "number",
        storageId: "version",
        alias: "version"
    })
};
