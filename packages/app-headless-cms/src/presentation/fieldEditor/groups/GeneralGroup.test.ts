import { describe, it, expect } from "vitest";
import { GeneralGroupImpl } from "./GeneralGroup.js";
import { RulesGroupImpl } from "./RulesGroup.js";
import { createTestField, hideWhenDraft, readOnlyRule, teamPermission } from "./testFixtures.js";

const createGroup = () => new GeneralGroupImpl();

const formData = (readOnly: boolean) => ({
    label: "External ID",
    fieldId: "externalId",
    list: false,
    predefinedValuesEnabled: false,
    readOnly,
    description: "",
    note: "",
    help: "",
    tags: []
});

describe("GeneralGroup read-only flag", () => {
    it("reads the flag off an unconditional disable rule", () => {
        const group = createGroup();

        expect(group.mapToForm(createTestField([readOnlyRule])).readOnly).toBe(true);
        expect(group.mapToForm(createTestField([hideWhenDraft])).readOnly).toBe(false);
        expect(group.mapToForm(createTestField([])).readOnly).toBe(false);
    });

    it("writes a read-only rule when the flag is on", () => {
        const group = createGroup();
        const field = createTestField([]);
        group.mapFromForm(formData(true), field);

        expect(field.rules).toEqual([readOnlyRule]);
    });

    it("removes the read-only rule when the flag is off", () => {
        const group = createGroup();
        const field = createTestField([readOnlyRule]);
        group.mapFromForm(formData(false), field);

        expect(field.rules).toEqual([]);
    });

    it("leaves rules owned by the other groups alone", () => {
        const group = createGroup();
        const field = createTestField([teamPermission, hideWhenDraft]);
        group.mapFromForm(formData(true), field);

        expect(field.rules).toEqual([teamPermission, hideWhenDraft, readOnlyRule]);
    });

    it("survives a submit that also rewrites the condition rules", () => {
        /**
         * Both groups write to field.rules on the same submit, General first and Rules after.
         * This pins the interaction so a future change to either filter can't silently drop
         * the read-only rule.
         */
        const general = createGroup();
        const rules = new RulesGroupImpl();
        const field = createTestField([]);

        general.mapFromForm(formData(true), field);
        rules.mapFromForm({ conditionRules: [hideWhenDraft] }, field);

        expect(field.rules).toEqual([readOnlyRule, hideWhenDraft]);
    });

    it("round-trips both groups without duplicating rules", () => {
        const general = createGroup();
        const rules = new RulesGroupImpl();
        const field = createTestField([readOnlyRule, hideWhenDraft, teamPermission]);

        for (let i = 0; i < 2; i++) {
            general.mapFromForm({ ...formData(general.mapToForm(field).readOnly) }, field);
            rules.mapFromForm(rules.mapToForm(field), field);
        }

        expect(field.rules).toHaveLength(3);
        expect(field.rules).toContainEqual(readOnlyRule);
        expect(field.rules).toContainEqual(hideWhenDraft);
        expect(field.rules).toContainEqual(teamPermission);
    });
});
