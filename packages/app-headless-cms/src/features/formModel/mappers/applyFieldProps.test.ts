import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { applyFieldProps } from "./applyFieldProps.js";
import type { CmsModelField } from "~/types.js";

const createField = (overrides: Partial<CmsModelField>): CmsModelField =>
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

/**
 * Builds a one-field form the way CmsFormModelBuilder does, so we assert on the
 * field the entry form actually renders rather than on the builder in isolation.
 */
const buildForm = (field: CmsModelField) => {
    const container = new Container();
    FormModelFeature.register(container);

    return container.resolve(FormModelFactory).create({
        fields: registry => ({
            [field.fieldId]: applyFieldProps(registry.text(), field, new Map())
        })
    });
};

describe("applyFieldProps disabled", () => {
    it("disables the form field when the model field is disabled", () => {
        const form = buildForm(createField({ disabled: true }));

        expect(form.field("externalId").disabled).toBe(true);
    });

    it("leaves the field editable when disabled is false or absent", () => {
        expect(buildForm(createField({ disabled: false })).field("externalId").disabled).toBe(
            false
        );
        expect(buildForm(createField({})).field("externalId").disabled).toBe(false);
    });

    it("keeps the field visible", () => {
        const form = buildForm(createField({ disabled: true }));

        expect(form.field("externalId").visible).toBe(true);
    });

    it("does not stop the field from holding a value", () => {
        const form = buildForm(createField({ disabled: true }));
        form.field("externalId").setValue("abc-123");

        expect(form.field("externalId").getValue()).toBe("abc-123");
        expect(form.field("externalId").disabled).toBe(true);
    });
});
