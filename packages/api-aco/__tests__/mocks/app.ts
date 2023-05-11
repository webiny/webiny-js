import { IAcoAppRegisterParams } from "~/apps/types";
import { CmsModelField } from "@webiny/api-headless-cms/types";

export const createMockAppTitleField = (): CmsModelField => {
    return {
        id: "title",
        fieldId: "title",
        type: "text",
        storageId: "text@title",
        label: "Title"
    };
};
export const createMockAppCreatedByField = (): CmsModelField => {
    return {
        id: "createdBy",
        fieldId: "createdBy",
        type: "object",
        storageId: "object@createdBy",
        label: "Created By",
        settings: {
            fields: [
                {
                    id: "id",
                    fieldId: "id",
                    type: "text",
                    storageId: "text@id",
                    label: "ID"
                },
                {
                    id: "displayName",
                    fieldId: "displayName",
                    type: "text",
                    storageId: "text@displayName",
                    label: "Display Name"
                },
                {
                    id: "type",
                    fieldId: "type",
                    type: "text",
                    storageId: "text@type",
                    label: "Type"
                }
            ]
        }
    };
};
export const createMockAppCreatedOnField = (): CmsModelField => {
    return {
        id: "createdOn",
        fieldId: "createdOn",
        type: "datetime",
        storageId: "datetime@createdOn",
        label: "Created On"
    };
};
export const createMockAppVersionField = (): CmsModelField => {
    return {
        id: "version",
        fieldId: "version",
        type: "number",
        storageId: "number@version",
        label: "Version"
    };
};
export const createMockAppLockedField = (): CmsModelField => {
    return {
        id: "locked",
        fieldId: "locked",
        type: "boolean",
        storageId: "boolean@locked",
        label: "Locked"
    };
};

export const MOCK_APP_NAME = "MockApp";
export const MOCK_APP_API_NAME = "MockAppApiName";
export const createMockApp = (
    params: Partial<IAcoAppRegisterParams> = {}
): IAcoAppRegisterParams => {
    return {
        name: MOCK_APP_NAME,
        apiName: MOCK_APP_API_NAME,
        fields: [
            createMockAppTitleField(),
            createMockAppCreatedByField(),
            createMockAppCreatedOnField(),
            createMockAppVersionField(),
            createMockAppLockedField()
        ],
        ...params
    };
};
