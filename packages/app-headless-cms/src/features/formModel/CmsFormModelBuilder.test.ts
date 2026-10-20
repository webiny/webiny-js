import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsFormModelFeature } from "~/features/formModel/feature.js";
import { DateTimeInputRenderer } from "~/presentation/fieldTypes/renderers/dateTime/DateTimeInputRenderer.js";
import { DateTimeInputsRenderer } from "~/presentation/fieldTypes/renderers/dateTime/DateTimeInputsRenderer.js";
import { BirthdayInputRenderer } from "~/presentation/fieldTypes/renderers/dateTime/BirthdayInputRenderer.js";
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
    container.register(BirthdayInputRenderer);
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

describe("CmsFormModelBuilder birthday picker", () => {
    it("renders a date-only field with the birthday picker and keeps its value", () => {
        const form = createCmsForm([
            field("dob", "datetime", false, "birthday-input", {
                settings: { type: "date" },
                renderer: { name: "birthday-input", settings: null }
            })
        ]);
        form.setData({ dob: "1990-02-09" });

        const vm = form.field("dob").vm as any;
        expect(vm.renderer).toBe("birthdayInput");
        expect(vm.rendererSettings).toEqual({ type: "date" });
        expect(vm.value).toBe("1990-02-09");
    });

    it("hands the field's date limits to the birthday picker", () => {
        const form = createCmsForm([
            field("dob", "datetime", false, "birthday-input", {
                settings: { type: "date" },
                validation: [
                    { name: "dateGte", message: "Too old.", settings: { value: "1950-01-01" } },
                    {
                        name: "dateLte",
                        message: "You must be 18 or older.",
                        settings: { expression: "today-18y", type: "date" }
                    }
                ]
            })
        ]);

        expect((form.field("dob").vm as any).rendererSettings).toEqual({
            type: "date",
            dateLimits: { gte: ["1950-01-01"], lte: [{ expression: "today-18y" }] }
        });
    });

    it("falls back to the date/time input when the field is no longer date-only", () => {
        const form = createCmsForm([
            field("openTime", "datetime", false, "birthday-input", { settings: { type: "time" } })
        ]);

        expect(form.field("openTime").vm.renderer).toBe("dateTimeInput");
    });
});

describe("CmsFormModelBuilder validators", () => {
    const validate = async (form: ReturnType<typeof createCmsForm>, name: string) => {
        const valid = await form.field(name).validate({ force: true });
        return { valid, message: form.field(name).vm.validation.message };
    };

    it("checks both date limits on a field that has two", async () => {
        const form = createCmsForm([
            field("bornOn", "datetime", false, "date-time-input", {
                settings: { type: "date" },
                validation: [
                    { name: "dateGte", message: "Too early.", settings: { value: "1950-01-01" } },
                    { name: "dateLte", message: "Too late.", settings: { value: "2000-12-31" } }
                ]
            })
        ]);

        form.setData({ bornOn: "2005-01-01" });
        expect(await validate(form, "bornOn")).toEqual({ valid: false, message: "Too late." });

        form.setData({ bornOn: "1949-01-01" });
        expect(await validate(form, "bornOn")).toEqual({ valid: false, message: "Too early." });

        form.setData({ bornOn: "1975-06-15" });
        expect((await validate(form, "bornOn")).valid).toBe(true);
    });

    it("works out a relative limit from today", async () => {
        const form = createCmsForm([
            field("bornOn", "datetime", false, "birthday-input", {
                settings: { type: "date" },
                validation: [
                    {
                        name: "dateLte",
                        message: "You must be 18 or older.",
                        settings: { expression: "today-18y", type: "date" }
                    }
                ]
            })
        ]);

        form.setData({ bornOn: `${new Date().getFullYear() - 10}-01-01` });
        expect(await validate(form, "bornOn")).toEqual({
            valid: false,
            message: "You must be 18 or older."
        });

        form.setData({ bornOn: `${new Date().getFullYear() - 30}-01-01` });
        expect((await validate(form, "bornOn")).valid).toBe(true);
    });

    it("checks every validator on a text field that has several", async () => {
        const form = createCmsForm([
            field("code", "text", false, "text-input", {
                validation: [
                    { name: "minLength", message: "Too short.", settings: { value: 3 } },
                    { name: "maxLength", message: "Too long.", settings: { value: 5 } },
                    { name: "pattern", message: "Letters only.", settings: { regex: "^[a-z]+$" } }
                ]
            })
        ]);

        form.setData({ code: "ab" });
        expect(await validate(form, "code")).toEqual({ valid: false, message: "Too short." });

        form.setData({ code: "abcdef" });
        expect(await validate(form, "code")).toEqual({ valid: false, message: "Too long." });

        form.setData({ code: "ab1" });
        expect(await validate(form, "code")).toEqual({ valid: false, message: "Letters only." });

        form.setData({ code: "abcd" });
        expect((await validate(form, "code")).valid).toBe(true);
    });
});

const rowNames = (layout: any[]) => layout.map(row => row.fields.map((f: any) => f.name));

describe("CmsFormModelBuilder nested layouts", () => {
    it("lays out a single object with the layout stored on the field", () => {
        const form = createCmsForm([
            field("address", "object", false, "object-accordion", {
                settings: {
                    fields: [
                        field("street", "text", false, "text-input"),
                        // Fields created in the model editor have an `id` that differs from `fieldId`.
                        field("city", "text", false, "text-input", { id: "c1ty" }),
                        field("zipCode", "text", false, "text-input")
                    ],
                    layout: [["street"], ["c1ty", "zipCode"]]
                }
            })
        ]);

        expect(rowNames((form.field("address").vm as any).layout)).toEqual([
            ["street"],
            ["city", "zipCode"]
        ]);
    });

    it("lays out every item of an object list", () => {
        const form = createCmsForm([
            field("facilityStats", "object", true, "objects-accordion", {
                settings: {
                    fields: [
                        field("statValue", "text", false, "text-input"),
                        field("statLabel", "text", false, "text-input")
                    ],
                    layout: [["statValue", "statLabel"]]
                }
            })
        ]);

        form.setData({ facilityStats: [{ statValue: "1", statLabel: "a" }] });
        const vm = form.field("facilityStats").vm as any;

        expect(rowNames(vm.items[0].layout)).toEqual([["statValue", "statLabel"]]);
    });

    it("gives children missing from the stored layout a row of their own", () => {
        const form = createCmsForm([
            field("address", "object", false, "object-accordion", {
                settings: {
                    fields: [
                        field("street", "text", false, "text-input"),
                        field("city", "text", false, "text-input"),
                        field("state", "text", false, "text-input")
                    ],
                    layout: [["street", "city"]]
                }
            })
        ]);

        expect(rowNames((form.field("address").vm as any).layout)).toEqual([
            ["street", "city"],
            ["state"]
        ]);
    });

    it("lays out a dynamic zone template with the template's layout", () => {
        const form = createCmsForm([
            field("blocks", "dynamicZone", true, "dynamicZone", {
                settings: {
                    templates: [
                        {
                            id: "hero",
                            name: "Hero",
                            gqlTypeName: "Hero",
                            description: "",
                            icon: null,
                            fields: [
                                field("title", "text", false, "text-input"),
                                field("subtitle", "text", false, "text-input")
                            ],
                            layout: [["title", "subtitle"]],
                            validation: []
                        }
                    ]
                }
            })
        ]);

        form.setData({ blocks: [{ _templateId: "hero", title: "T", subtitle: "S" }] });
        const vm = form.field("blocks").vm as any;

        expect(rowNames(vm.items[0].layout)).toEqual([["title", "subtitle"]]);
    });
});
