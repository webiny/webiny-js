import { describe, it, expect } from "vitest";
import { RulesGroupImpl } from "./RulesGroup.js";
import type { CmsModelField, FieldRule } from "~/types.js";

const createGroup = () => new RulesGroupImpl();

const createField = (rules: FieldRule[]): CmsModelField => ({
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

const readOnlyRule: FieldRule = {
    type: "condition",
    target: "",
    operator: "always",
    value: null,
    action: "disable"
};

const hideWhenDraft: FieldRule = {
    type: "condition",
    target: "status",
    operator: "eq",
    value: "draft",
    action: "hide"
};

const teamPermission: FieldRule = {
    type: "accessControl",
    target: "identity",
    operator: "matches",
    value: "team:editors",
    action: "disable"
};

describe("RulesGroup", () => {
    it("reads the read-only flag off an unconditional disable rule", () => {
        const group = createGroup();
        const data = group.mapToForm(createField([readOnlyRule]));

        expect(data.readOnly).toBe(true);
    });

    it("keeps the read-only rule out of the condition rules list", () => {
        const group = createGroup();
        const data = group.mapToForm(createField([readOnlyRule, hideWhenDraft]));

        expect(data.readOnly).toBe(true);
        expect(data.conditionRules).toEqual([hideWhenDraft]);
    });

    it("writes a read-only rule when the flag is on", () => {
        const group = createGroup();
        const field = createField([]);
        group.mapFromForm({ readOnly: true, conditionRules: [] }, field);

        expect(field.rules).toEqual([readOnlyRule]);
    });

    it("removes the read-only rule when the flag is off", () => {
        const group = createGroup();
        const field = createField([readOnlyRule]);
        group.mapFromForm({ readOnly: false, conditionRules: [] }, field);

        expect(field.rules).toEqual([]);
    });

    it("leaves rules owned by other groups alone", () => {
        const group = createGroup();
        const field = createField([teamPermission, readOnlyRule]);
        group.mapFromForm({ readOnly: true, conditionRules: [hideWhenDraft] }, field);

        expect(field.rules).toEqual([teamPermission, hideWhenDraft, readOnlyRule]);
    });

    it("round-trips without duplicating the read-only rule", () => {
        const group = createGroup();
        const field = createField([readOnlyRule, hideWhenDraft]);

        group.mapFromForm(group.mapToForm(field), field);
        group.mapFromForm(group.mapToForm(field), field);

        expect(field.rules).toEqual([hideWhenDraft, readOnlyRule]);
    });
});
