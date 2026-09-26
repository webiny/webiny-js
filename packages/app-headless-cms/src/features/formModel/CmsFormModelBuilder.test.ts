import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsFormModelFeature } from "~/features/formModel/feature.js";
import { DateTimeInputRenderer } from "~/presentation/fieldTypes/renderers/dateTime/DateTimeInputRenderer.js";
import { DateTimeInputsRenderer } from "~/presentation/fieldTypes/renderers/dateTime/DateTimeInputsRenderer.js";
import { TextInputRenderer } from "~/presentation/fieldTypes/renderers/text/TextInputRenderer.js";
import { TextInputsRenderer } from "~/presentation/fieldTypes/renderers/text/TextInputsRenderer.js";

const field = (fieldId: string, type: string, list: boolean, renderer: string, extra = {}) => ({
    id: fieldId,
    fieldId,
    type,
    label: fieldId,
    tags: [],
    list,
    renderer: { name: renderer, settings: {} },
    validation: [],
    listValidation: [],
    settings: {},
    predefinedValues: { enabled: false, values: [] },
    ...extra
});

function createCmsForm(fields: any[]) {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    CmsFormModelFeature.register(container);
    container.register(DateTimeInputRenderer);
    container.register(DateTimeInputsRenderer);
    container.register(TextInputRenderer);
    container.register(TextInputsRenderer);

    const model = {
        modelId: "test",
        fields,
        layout: fields.map(f => [f.fieldId])
    } as any;
    const config = container.resolve(CmsFormModelBuilder).build(model);
    return container.resolve(FormModelFactory).create(config);
}

describe("CmsFormModelBuilder renderer cardinality", () => {
    it("keeps renderers that match the field's cardinality", () => {
        const form = createCmsForm([
            field("single", "datetime", false, "date-time-input"),
            field("many", "datetime", true, "date-time-inputs")
        ]);

        expect(form.field("single").vm.renderer).toBe("dateTimeInput");
        expect(form.field("many").vm.renderer).toBe("dateTimeInputs");
    });

    it("falls back to the single-value renderer when a list renderer is set on a non-list field", () => {
        const form = createCmsForm([
            field("openTime", "datetime", false, "date-time-inputs"),
            field("name", "text", false, "text-inputs")
        ]);

        expect(form.field("openTime").vm.renderer).toBe("dateTimeInput");
        expect(form.field("name").vm.renderer).toBe("textInput");
    });

    it("keeps the list renderer for list datetime fields with a subtype", () => {
        const form = createCmsForm(
            ["date", "time", "dateTimeWithTimezone", "dateTimeWithoutTimezone"].map(type =>
                field(type, "datetime", true, "date-time-inputs", { settings: { type } })
            )
        );

        expect(form.field("date").vm.renderer).toBe("dateTimeInputs");
        expect(form.field("time").vm.renderer).toBe("dateTimeInputs");
        expect(form.field("dateTimeWithTimezone").vm.renderer).toBe("dateTimeInputs");
        expect(form.field("dateTimeWithoutTimezone").vm.renderer).toBe("dateTimeInputs");
    });

    it("applies the fallback to fields nested in object lists", () => {
        const form = createCmsForm([
            field("holidayHours", "object", true, "objects-accordion", {
                settings: {
                    fields: [field("openTime", "datetime", false, "date-time-inputs")],
                    layout: [["openTime"]]
                }
            })
        ]);

        form.setData({ holidayHours: [{ openTime: "2026-12-24T09:00:00.000Z" }] });
        const item = (form.field("holidayHours") as any).items[0];

        expect(item.children.get("openTime").vm.renderer).toBe("dateTimeInput");
    });
});
