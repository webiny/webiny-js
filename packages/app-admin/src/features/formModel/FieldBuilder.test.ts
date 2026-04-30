import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Container } from "@webiny/di";
import { FormModelFeature } from "./feature.js";
import { FieldBuilderRegistry, type IFieldBuilderRegistry } from "./abstractions.js";
import { TextFieldBuilder } from "./fieldTypes/TextFieldType.js";
import { NumberFieldBuilder } from "./fieldTypes/NumberFieldType.js";
import { BooleanFieldBuilder } from "./fieldTypes/BooleanFieldType.js";
import { DateTimeFieldBuilder } from "./fieldTypes/DateTimeFieldType.js";

function createRegistry(): IFieldBuilderRegistry {
    const container = new Container();
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
        expect(config.renderer).toBe("dropdown");
    });

    it("should support reactive options function", () => {
        const optionsFn = () => [{ label: "A", value: "a" }];
        const config = new TextFieldBuilder().options(optionsFn).build("dynamic");
        expect(typeof config.options).toBe("function");
    });

    it("should auto-switch renderer to dropdown when options are set", () => {
        const config = new TextFieldBuilder().options([{ label: "A", value: "a" }]).build("field");
        expect(config.renderer).toBe("dropdown");
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
        expect(config.renderer).toBe("dropdown");
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
        expect(config.renderer).toBe("dropdown");
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

    it("should pass through null, undefined, and empty string for NumberFieldBuilder", () => {
        const builder = new NumberFieldBuilder();
        expect(builder.normalizeValue(null)).toBe(null);
        expect(builder.normalizeValue(undefined)).toBe(undefined);
        expect(builder.normalizeValue("")).toBe("");
    });

    it("should pass through NaN-producing strings for NumberFieldBuilder", () => {
        const builder = new NumberFieldBuilder();
        expect(builder.normalizeValue("abc")).toBe("abc");
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
