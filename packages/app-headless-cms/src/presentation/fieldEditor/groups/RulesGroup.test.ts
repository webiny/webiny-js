import { describe, it, expect } from "vitest";
import { RulesGroupImpl } from "./RulesGroup.js";
import { createTestField, hideWhenDraft, readOnlyRule, teamPermission } from "./testFixtures.js";

const createGroup = () => new RulesGroupImpl();

describe("RulesGroup", () => {
    it("keeps the read-only rule out of the condition rules list", () => {
        const group = createGroup();
        const data = group.mapToForm(createTestField([readOnlyRule, hideWhenDraft]));

        expect(data.conditionRules).toEqual([hideWhenDraft]);
    });

    it("leaves rules owned by other groups alone", () => {
        const group = createGroup();
        const field = createTestField([teamPermission]);
        group.mapFromForm({ conditionRules: [hideWhenDraft] }, field);

        expect(field.rules).toEqual([teamPermission, hideWhenDraft]);
    });

    it("does not clear the read-only rule when conditions are edited", () => {
        const group = createGroup();
        const field = createTestField([readOnlyRule]);
        group.mapFromForm({ conditionRules: [hideWhenDraft] }, field);

        expect(field.rules).toEqual([readOnlyRule, hideWhenDraft]);
    });

    it("does not re-add a read-only rule submitted as a condition", () => {
        const group = createGroup();
        const field = createTestField([]);
        group.mapFromForm({ conditionRules: [readOnlyRule, hideWhenDraft] }, field);

        expect(field.rules).toEqual([hideWhenDraft]);
    });

    it("round-trips without duplicating rules", () => {
        const group = createGroup();
        const field = createTestField([readOnlyRule, hideWhenDraft]);

        group.mapFromForm(group.mapToForm(field), field);
        group.mapFromForm(group.mapToForm(field), field);

        expect(field.rules).toEqual([readOnlyRule, hideWhenDraft]);
    });
});
