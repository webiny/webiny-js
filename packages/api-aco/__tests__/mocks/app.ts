import { IAcoAppRegisterParams } from "~/types";
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { registerAcoApp } from "~/plugins";

export const createMockAppTextField = (): CmsModelField => {
    return {
        id: "someText",
        fieldId: "someText",
        type: "text",
        storageId: "text@someText",
        label: "Some Text"
    };
};
export const createMockAppIdentityField = (): CmsModelField => {
    return {
        id: "identity",
        fieldId: "identity",
        type: "object",
        storageId: "object@identity",
        label: "Identity",
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
export const createMockAppCustomCreatedOnField = (): CmsModelField => {
    return {
        id: "customCreatedOn",
        fieldId: "customCreatedOn",
        type: "datetime",
        storageId: "datetime@customCreatedOn",
        label: "Custom Created On",
        settings: {
            type: "dateTimeWithoutTimezone"
        }
    };
};
export const createMockAppCustomVersionField = (): CmsModelField => {
    return {
        id: "customVersion",
        fieldId: "customVersion",
        type: "number",
        storageId: "number@customVersion",
        label: "Custom Version"
    };
};
export const createMockAppCustomLockedField = (): CmsModelField => {
    return {
        id: "customLocked",
        fieldId: "customLocked",
        type: "boolean",
        storageId: "boolean@customLocked",
        label: "Custom Locked"
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
            createMockAppTextField(),
            createMockAppIdentityField(),
            createMockAppCustomCreatedOnField(),
            createMockAppCustomVersionField(),
            createMockAppCustomLockedField()
        ],
        ...params
    };
};

export const createMockAcoApp = (params: Partial<IAcoAppRegisterParams> = {}) => {
    return registerAcoApp(createMockApp(params));
};
