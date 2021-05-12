import { CmsContentModelField } from "@webiny/api-headless-cms/types";

const id = ({
    id: "id",
    type: "text",
    fieldId: "id"
} as unknown) as CmsContentModelField;
const createdOn = ({
    id: "id",
    type: "datetime",
    fieldId: "createdOn"
} as unknown) as CmsContentModelField;
const savedOn = ({
    id: "id",
    type: "datetime",
    fieldId: "createdOn"
} as unknown) as CmsContentModelField;
const createdBy = ({
    id: "id",
    type: "plainObject",
    fieldId: "createdBy",
    settings: {
        path: "ownedBy.id"
    }
} as unknown) as CmsContentModelField;
const ownedBy = ({
    id: "id",
    type: "plainObject",
    fieldId: "ownedBy",
    settings: {
        path: "ownedBy.id"
    }
} as unknown) as CmsContentModelField;

export const systemFields: Record<string, CmsContentModelField> = {
    id,
    createdOn,
    savedOn,
    createdBy,
    ownedBy
};
