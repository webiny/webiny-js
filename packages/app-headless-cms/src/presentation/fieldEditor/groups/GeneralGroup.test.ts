import { describe, it, expect } from "vitest";
import { GeneralGroupImpl } from "./GeneralGroup.js";
import type { CmsModelField } from "~/types.js";

const createGroup = () => new GeneralGroupImpl();

const createField = (overrides: Partial<CmsModelField> = {}): CmsModelField =>
    ({
        id: "externalId",
        fieldId: "externalId",
        storageId: "text@externalId",
        type: "text",
        label: "External ID",
        renderer: { name: "text-input" },
        validation: [],
        listValidation: [],
        ...overrides
    }) as CmsModelField;

const formData = (disabled: boolean) => ({
    label: "External ID",
    fieldId: "externalId",
    list: false,
    predefinedValuesEnabled: false,
    disabled,
    description: "",
    note: "",
    help: "",
    tags: []
});

describe("GeneralGroup disabled flag", () => {
    it("reads the flag off the field", () => {
        const group = createGroup();

        expect(group.mapToForm(createField({ disabled: true })).disabled).toBe(true);
        expect(group.mapToForm(createField({ disabled: false })).disabled).toBe(false);
    });

    it("defaults to false for a field that predates the flag", () => {
        const group = createGroup();

        expect(group.mapToForm(createField()).disabled).toBe(false);
    });

    it("writes the flag back to the field", () => {
        const group = createGroup();

        const enabled = createField();
        createGroup().mapFromForm(formData(true), enabled);
        expect(enabled.disabled).toBe(true);

        const cleared = createField({ disabled: true });
        group.mapFromForm(formData(false), cleared);
        expect(cleared.disabled).toBe(false);
    });

    it("round-trips without changing the value", () => {
        const group = createGroup();
        const field = createField({ disabled: true });

        group.mapFromForm({ ...formData(group.mapToForm(field).disabled) }, field);
        group.mapFromForm({ ...formData(group.mapToForm(field).disabled) }, field);

        expect(field.disabled).toBe(true);
    });
});
