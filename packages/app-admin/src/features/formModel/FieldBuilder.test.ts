import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
    TextFieldBuilder,
    SelectFieldBuilder,
    createFieldBuilderRegistry
} from "./FieldBuilder.js";

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

describe("SelectFieldBuilder", () => {
    it("should build a select field config with static options", () => {
        const options = [
            { label: "English", value: "en" },
            { label: "German", value: "de" }
        ];

        const builder = new SelectFieldBuilder().label("Language").options(options).required();

        const config = builder.build("language");

        expect(config.name).toBe("language");
        expect(config.type).toBe("select");
        expect(config.label).toBe("Language");
        expect(config.required).toBe(true);
        expect(config.options).toEqual(options);
    });

    it("should support reactive options function", () => {
        const optionsFn = () => [{ label: "A", value: "a" }];
        const config = new SelectFieldBuilder().options(optionsFn).build("dynamic");
        expect(typeof config.options).toBe("function");
    });
});

describe("FieldBuilderRegistry", () => {
    it("should create text builders via registry.text()", () => {
        const registry = createFieldBuilderRegistry();
        const builder = registry.text();
        expect(builder).toBeInstanceOf(TextFieldBuilder);
    });

    it("should create select builders via registry.select()", () => {
        const registry = createFieldBuilderRegistry();
        const builder = registry.select();
        expect(builder).toBeInstanceOf(SelectFieldBuilder);
    });

    it("should support chaining on registry-created builders", () => {
        const registry = createFieldBuilderRegistry();
        const config = registry.text().label("Name").required().build("name");
        expect(config.label).toBe("Name");
        expect(config.required).toBe(true);
    });
});
