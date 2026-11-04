import { afterEach, describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { Container } from "@webiny/di";
import { FormModelFeature } from "./feature.js";
import { IdentityContextFeature } from "~/features/security/IdentityContext/feature.js";
import { FieldBuilderRegistry, type IFieldBuilderRegistry } from "./abstractions.js";
import { TextFieldBuilder } from "./fieldTypes/TextFieldType.js";
import { NumberFieldBuilder } from "./fieldTypes/NumberFieldType.js";
import { BooleanFieldBuilder } from "./fieldTypes/BooleanFieldType.js";
import { DateTimeFieldBuilder } from "./fieldTypes/DateTimeFieldType.js";
import { DateFormatter } from "~/features/dateFormatter/abstractions.js";

function createRegistry(): IFieldBuilderRegistry {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    return container.resolve(FieldBuilderRegistry);
}

describe("TextFieldBuilder", () => {
    it("should build a text field config with all fluent methods", () => {
        const builder = new TextFieldBuilder()
            .label("Title")
            .placeholder("Enter title")
            .required("Title is required")
            .defaultValue("Untitled")
            .renderer("custom-text")
            .schema(z.string().min(1));

        const config = builder.build("title");

        expect(config.name).toBe("title");
        expect(config.type).toBe("text");
        expect(config.label).toBe("Title");
        expect(config.placeholder).toBe("Enter title");
        expect(config.required).toBe(true);
        expect(config.requiredMessage).toBe("Title is required");
        expect(config.defaultValue).toBe("Untitled");
        expect(config.renderer).toBe("custom-text");
        expect(config.hidden).toBe(false);
        expect(config.disabled).toBe(false);
        expect(config.schema).toBeDefined();
    });

    it("should support hidden() method", () => {
        const config = new TextFieldBuilder().hidden().build("secret");
        expect(config.hidden).toBe(true);
    });

    it("should support disabled() method", () => {
        const config = new TextFieldBuilder().disabled().build("readonly");
        expect(config.disabled).toBe(true);
    });

    it("should default disabled to false", () => {
        const config = new TextFieldBuilder().build("field");
        expect(config.disabled).toBe(false);
    });
});

describe("TextFieldBuilder - beforeChange / afterChange", () => {
    it("should store beforeChange callbacks in config", () => {
        const cb1 = (value: unknown) => value;
        const cb2 = (value: unknown) => value;

        const config = new TextFieldBuilder().beforeChange(cb1).beforeChange(cb2).build("field");

        expect(config.beforeChangeCallbacks).toHaveLength(2);
        expect(config.beforeChangeCallbacks![0]).toBe(cb1);
        expect(config.beforeChangeCallbacks![1]).toBe(cb2);
    });

    it("should store afterChange callbacks in config", () => {
        const cb = () => {};
        const config = new TextFieldBuilder().afterChange(cb).build("field");

        expect(config.afterChangeCallbacks).toHaveLength(1);
        expect(config.afterChangeCallbacks![0]).toBe(cb);
    });

    it("should not have callback arrays when none are added", () => {
        const config = new TextFieldBuilder().build("field");
        expect(config.beforeChangeCallbacks).toBeUndefined();
        expect(config.afterChangeCallbacks).toBeUndefined();
    });

    it("should support chaining callbacks with other builder methods", () => {
        const config = new TextFieldBuilder()
            .label("Title")
            .beforeChange(value => value)
            .required("Required")
            .afterChange(() => {})
            .build("title");

        expect(config.label).toBe("Title");
        expect(config.required).toBe(true);
        expect(config.beforeChangeCallbacks).toHaveLength(1);
        expect(config.afterChangeCallbacks).toHaveLength(1);
    });
});

describe("TextFieldBuilder - options", () => {
    it("should build a text field config with static options", () => {
        const options = [
            { label: "English", value: "en" },
            { label: "German", value: "de" }
        ];

        const config = new TextFieldBuilder()
            .label("Language")
            .options(options)
            .required()
            .build("language");

        expect(config.name).toBe("language");
        expect(config.type).toBe("text");
        expect(config.label).toBe("Language");
        expect(config.required).toBe(true);
        expect(config.options).toEqual(options);
        expect(config.renderer).toBe("select");
    });

    it("should support reactive options function", () => {
        const optionsFn = () => [{ label: "A", value: "a" }];
        const config = new TextFieldBuilder().options(optionsFn).build("dynamic");
        expect(typeof config.options).toBe("function");
    });

    it("should auto-switch renderer to dropdown when options are set", () => {
        const config = new TextFieldBuilder().options([{ label: "A", value: "a" }]).build("field");
        expect(config.renderer).toBe("select");
    });

    it("should not override an explicitly set renderer", () => {
        const config = new TextFieldBuilder()
            .renderer("radioButtons")
            .options([{ label: "A", value: "a" }])
            .build("field");
        expect(config.renderer).toBe("radioButtons");
    });
});

describe("NumberFieldBuilder - options", () => {
    it("should build a number field config with options", () => {
        const options = [
            { label: "One", value: "1" },
            { label: "Two", value: "2" }
        ];

        const config = new NumberFieldBuilder().label("Count").options(options).build("count");

        expect(config.type).toBe("number");
        expect(config.options).toEqual(options);
        expect(config.renderer).toBe("select");
    });

    it("should not override an explicitly set renderer", () => {
        const config = new NumberFieldBuilder()
            .renderer("radioButtons")
            .options([{ label: "1", value: "1" }])
            .build("field");
        expect(config.renderer).toBe("radioButtons");
    });
});

describe("DateTimeFieldBuilder", () => {
    it("should build a datetime field with default renderer", () => {
        const config = new DateTimeFieldBuilder().label("Created").build("created");
        expect(config.type).toBe("datetime");
        expect(config.renderer).toBe("dateTimeInput");
        expect(config.label).toBe("Created");
    });

    it("keeps the list renderer when a subtype is set after list()", () => {
        const subtypes = [
            (b: DateTimeFieldBuilder) => b.dateOnly(),
            (b: DateTimeFieldBuilder) => b.timeOnly(),
            (b: DateTimeFieldBuilder) => b.withTimezone(),
            (b: DateTimeFieldBuilder) => b.withoutTimezone()
        ];
        for (const subtype of subtypes) {
            expect(subtype(new DateTimeFieldBuilder().list()).build("d").renderer).toBe(
                "dateTimeInputs"
            );
            expect(subtype(new DateTimeFieldBuilder()).build("d").renderer).toBe("dateTimeInput");
        }
    });

    it("renders a date-only field with the birthday picker", () => {
        const config = new DateTimeFieldBuilder().dateOnly().renderer("birthdayInput").build("dob");
        expect(config.renderer).toBe("birthdayInput");
        expect(config.rendererSettings).toBeUndefined();
    });

    it("keeps a birthday picker set before dateOnly() and drops it for other subtypes", () => {
        const birthday = () => new DateTimeFieldBuilder().renderer("birthdayInput");
        const dateOnly = birthday().dateOnly().build("dob");
        expect(dateOnly.renderer).toBe("birthdayInput");
        expect(dateOnly.rendererSettings).toEqual({ type: "date" });

        expect(birthday().timeOnly().build("t").renderer).toBe("dateTimeInput");
    });

    describe("date limits", () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        const isValid = async (config: { schema?: z.ZodTypeAny }, value: unknown) =>
            (await config.schema!.safeParseAsync(value)).success;

        it("hands fixed and relative limits to the renderer, whatever the call order", () => {
            const config = new DateTimeFieldBuilder()
                .dateOnly()
                .dateGte("1900-01-01")
                .dateLte({ expression: "today-18y" })
                .renderer("birthdayInput")
                .build("dob");
            expect(config.rendererSettings).toEqual({
                dateLimits: { gte: ["1900-01-01"], lte: [{ expression: "today-18y" }] }
            });
        });

        it("checks a value against fixed limits with their messages", async () => {
            const config = new DateTimeFieldBuilder()
                .dateOnly()
                .dateGte("1950-01-01", "Too early.")
                .dateLte("2000-12-31", "Too late.")
                .build("d");
            expect(await isValid(config, "1975-06-15")).toBe(true);
            expect(await isValid(config, "1950-01-01")).toBe(true);
            expect(await isValid(config, "2000-12-31")).toBe(true);

            const late = await config.schema!.safeParseAsync("2005-01-01");
            expect(late.success).toBe(false);
            expect(late.error?.issues[0].message).toBe("Too late.");

            const early = await config.schema!.safeParseAsync("1949-12-31");
            expect(early.error?.issues[0].message).toBe("Too early.");
        });

        it("works out an expression against the local date at the moment of the check", async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 9, 19, 12));
            const config = new DateTimeFieldBuilder()
                .dateOnly()
                .dateLte({ expression: "today-18y" })
                .build("dob");
            expect(await isValid(config, "2008-10-19")).toBe(true);
            expect(await isValid(config, "2008-10-20")).toBe(false);

            const message = (await config.schema!.safeParseAsync("2008-10-20")).error?.issues[0]
                .message;
            expect(message).toBe("Must be on or before 2008-10-19.");

            // The next day, the same form allows the next birthday.
            vi.setSystemTime(new Date(2026, 9, 20, 12));
            expect(await isValid(config, "2008-10-20")).toBe(true);
        });

        it("puts the limit into a message's {date} in the admin's date format", async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 9, 19, 12));
            const formatter = { format: vi.fn((date: unknown) => `formatted ${date}`) };
            const message = async (builder: DateTimeFieldBuilder, value: string) =>
                (await builder.build("d").schema!.safeParseAsync(value)).error?.issues[0].message;

            expect(
                await message(
                    new DateTimeFieldBuilder(formatter)
                        .dateOnly()
                        .dateLte({ expression: "today-18y" }, "Born on or before {date}, please."),
                    "2010-01-01"
                )
            ).toBe("Born on or before formatted 2008-10-19, please.");
            // A date-only limit is shown without a time, and in UTC so it keeps its day.
            expect(formatter.format).toHaveBeenLastCalledWith("2008-10-19", {
                hour: undefined,
                minute: undefined,
                timeZone: "UTC"
            });

            expect(
                await message(
                    new DateTimeFieldBuilder(formatter).dateOnly().dateGte("1950-01-01"),
                    "1949-12-31"
                )
            ).toBe("Must be on or after formatted 1950-01-01.");

            // A time has no date to format.
            expect(
                await message(
                    new DateTimeFieldBuilder(formatter).timeOnly().dateLte("12:00:00"),
                    "13:00:00"
                )
            ).toBe("Must be on or before 12:00:00.");
        });

        it("formats {date} with the registered DateFormatter", async () => {
            const container = new Container();
            container.registerInstance(DateFormatter, {
                format: (date: unknown) => `formatted ${date}`
            });
            IdentityContextFeature.register(container);
            FormModelFeature.register(container);
            const registry = container.resolve(FieldBuilderRegistry);
            const config = registry.datetime().dateOnly().dateLte("2000-12-31").build("d");
            const result = await config.schema!.safeParseAsync("2005-01-01");
            expect(result.error?.issues[0].message).toBe(
                "Must be on or before formatted 2000-12-31."
            );
        });

        it("keeps the field's own schema", async () => {
            const config = new DateTimeFieldBuilder()
                .dateOnly()
                .dateLte("2000-12-31")
                .schema(z.string().regex(/^19/, "Must be in the 1900s."))
                .build("d");
            expect(await isValid(config, "1990-01-01")).toBe(true);
            const result = await config.schema!.safeParseAsync("2000-01-01");
            expect(result.error?.issues[0].message).toBe("Must be in the 1900s.");
            expect(await isValid(config, "2005-01-01")).toBe(false);
        });

        it("checks every value of a list and lets an empty value through", async () => {
            const config = new DateTimeFieldBuilder()
                .list()
                .dateOnly()
                .dateGte("2000-01-01")
                .build("d");
            expect(await isValid(config, ["2001-01-01", "2002-01-01"])).toBe(true);
            expect(await isValid(config, ["2001-01-01", "1999-01-01"])).toBe(false);
            expect(await isValid(config, "")).toBe(true);
        });

        it("fails a value checked against an expression it can't read", async () => {
            const config = new DateTimeFieldBuilder()
                .dateOnly()
                .dateLte({ expression: "now-18y" })
                .build("d");
            const result = await config.schema!.safeParseAsync("2000-01-01");
            expect(result.error?.issues[0].message).toBe('Invalid date limit "now-18y".');
        });

        it("leaves a field without limits as it was", () => {
            const config = new DateTimeFieldBuilder().dateOnly().build("d");
            expect(config.schema).toBeUndefined();
            expect(config.rendererSettings).toEqual({ type: "date" });
        });
    });

    it("normalizes withTimezone values", () => {
        const builder = new DateTimeFieldBuilder().withTimezone();
        expect(builder.normalizeValue("2026-05-01T14:30:00+02:00")).toBe(
            "2026-05-01T14:30:00+02:00"
        );
        expect(builder.normalizeValue("2026-05-01T14:30-05:30")).toBe("2026-05-01T14:30:00-05:30");
        expect(builder.normalizeValue("2026-05-01T09:00:00.000Z")).toBe(
            "2026-05-01T09:00:00.000+00:00"
        );
        expect(builder.normalizeValue("2026-05-01T14:30:00")).toBe("2026-05-01T14:30:00");
    });

    it("normalizes withoutTimezone values to a stable UTC instant", () => {
        const builder = new DateTimeFieldBuilder().withoutTimezone();
        const value = "2026-05-01T12:30:00.000Z";
        expect(builder.normalizeValue(value)).toBe(value);
        expect(builder.normalizeValue(builder.normalizeValue(value))).toBe(value);
    });
});

describe("FieldBuilderRegistry", () => {
    it("should create text builders via registry.text()", () => {
        const registry = createRegistry();
        const builder = registry.text();
        expect(builder).toBeInstanceOf(TextFieldBuilder);
    });

    it("should create number builders via registry.number()", () => {
        const registry = createRegistry();
        const builder = registry.number();
        expect(builder).toBeInstanceOf(NumberFieldBuilder);
    });

    it("should create boolean builders via registry.boolean()", () => {
        const registry = createRegistry();
        const builder = registry.boolean();
        expect(builder).toBeInstanceOf(BooleanFieldBuilder);
    });

    it("should create datetime builders via registry.datetime()", () => {
        const registry = createRegistry();
        const builder = registry.datetime();
        expect(builder).toBeInstanceOf(DateTimeFieldBuilder);
    });

    it("should support chaining on registry-created builders", () => {
        const registry = createRegistry();
        const config = registry.text().label("Name").required().build("name");
        expect(config.label).toBe("Name");
        expect(config.required).toBe(true);
    });

    it("should support options on text builders from registry", () => {
        const registry = createRegistry();
        const config = registry
            .text()
            .options([{ label: "A", value: "a" }])
            .build("field");
        expect(config.options).toHaveLength(1);
        expect(config.renderer).toBe("select");
    });
});

describe("normalizeValue", () => {
    it("should be identity for TextFieldBuilder", () => {
        const builder = new TextFieldBuilder();
        expect(builder.normalizeValue("hello")).toBe("hello");
        expect(builder.normalizeValue(42)).toBe(42);
        expect(builder.normalizeValue(null)).toBe(null);
    });

    it("should coerce string to number for NumberFieldBuilder", () => {
        const builder = new NumberFieldBuilder();
        expect(builder.normalizeValue("42")).toBe(42);
        expect(builder.normalizeValue("3.14")).toBe(3.14);
        expect(builder.normalizeValue("0")).toBe(0);
    });

    it("should return null for non-numeric values in NumberFieldBuilder", () => {
        const builder = new NumberFieldBuilder();
        expect(builder.normalizeValue(null)).toBe(null);
        expect(builder.normalizeValue(undefined)).toBe(null);
        expect(builder.normalizeValue("")).toBe(null);
        expect(builder.normalizeValue("abc")).toBe(null);
    });

    it("should coerce to boolean for BooleanFieldBuilder", () => {
        const builder = new BooleanFieldBuilder();
        expect(builder.normalizeValue(1)).toBe(true);
        expect(builder.normalizeValue(0)).toBe(false);
        expect(builder.normalizeValue("")).toBe(false);
        expect(builder.normalizeValue("yes")).toBe(true);
        expect(builder.normalizeValue(null)).toBe(false);
    });

    it("should be identity for DateTimeFieldBuilder", () => {
        const builder = new DateTimeFieldBuilder();
        expect(builder.normalizeValue("2024-01-01")).toBe("2024-01-01");
        expect(builder.normalizeValue(null)).toBe(null);
    });

    it("should capture normalizeValue into config at build time", () => {
        const config = new NumberFieldBuilder().label("Count").build("count");
        expect(config.normalizeValue).toBeDefined();
        expect(config.normalizeValue!("42")).toBe(42);
        expect(config.normalizeValue!(null)).toBe(null);
    });
});
