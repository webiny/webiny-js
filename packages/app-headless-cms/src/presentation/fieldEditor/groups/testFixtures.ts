import type { CmsModelField, FieldRule } from "~/types.js";

export const createTestField = (rules: FieldRule[]): CmsModelField => ({
    id: "abc123",
    fieldId: "externalId",
    storageId: "text@abc123",
    type: "text",
    label: "External ID",
    renderer: { name: "text-input" },
    validation: [],
    listValidation: [],
    rules
});

export const readOnlyRule: FieldRule = {
    type: "condition",
    target: "",
    operator: "always",
    value: null,
    action: "disable"
};

export const hideWhenDraft: FieldRule = {
    type: "condition",
    target: "status",
    operator: "eq",
    value: "draft",
    action: "hide"
};

export const teamPermission: FieldRule = {
    type: "accessControl",
    target: "identity",
    operator: "matches",
    value: "team:editors",
    action: "disable"
};
