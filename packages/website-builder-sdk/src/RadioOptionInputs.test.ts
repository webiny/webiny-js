import { describe, it, expect } from "vitest";
import { ComponentManifestToAstConverter } from "./ComponentManifestToAstConverter.js";
import { InputsBindingsProcessor } from "./InputBindingsProcessor.js";
import { ElementFactory } from "./ElementFactory.js";
import { createColorInput, createRadioInput, createTextInput } from "./createInput.js";
import {
    getRadioOptionNodes,
    getSelectedRadioValue,
    hasRadioOptionInputs,
    withRadioValue
} from "./radioOptionInputs.js";
import type { ComponentManifest, Document, DocumentElementBindings } from "~/types.js";

const header = (maxLength: number) => {
    return createTextInput({
        name: "header",
        label: "Headline",
        defaultValue: "Enter header text",
        translatable: true,
        required: true,
        renderer: { name: "Webiny/Input", settings: { maxLength } }
    });
};
const arrow = (label: string) => createColorInput({ name: "arrow", label, defaultValue: "" });

const layout = createRadioInput({
    name: "layout",
    label: "Layout",
    defaultValue: "1",
    options: [
        { value: "1", label: "One", inputs: [header(54), arrow("Button arrow")] },
        {
            value: "2",
            label: "Two",
            inputs: [header(54), createColorInput({ name: "image", defaultValue: "" })]
        },
        { value: "3", label: "Three", inputs: [header(54), arrow("Button")] },
        { value: "4", label: "Four", image: "data:image/svg+xml,x", inputs: [header(64)] }
    ]
});

const alignment = createRadioInput({
    name: "alignment",
    defaultValue: "center",
    options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" }
    ]
});

const banner: ComponentManifest = {
    name: "Test/Banner",
    label: "Banner",
    tags: [],
    inputs: [layout, alignment]
};

const root: ComponentManifest = {
    name: "Webiny/Root",
    label: "Root",
    tags: [],
    inputs: [
        { type: "slot", list: true, renderer: "Webiny/Slot", defaultValue: [], name: "children" }
    ]
};

const createDocument = () => {
    return {
        state: {},
        elements: {
            root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Root" } }
        },
        bindings: {}
    } as unknown as Document;
};

describe("radio with option inputs", () => {
    it("keeps a radio without option inputs a scalar leaf", () => {
        const [node] = ComponentManifestToAstConverter.convert([alignment]);

        expect(node.type).toBe("radio");
        expect(node.children).toEqual([]);
    });

    it("turns a radio with option inputs into an object: value plus the inputs merged by name", () => {
        const [node] = ComponentManifestToAstConverter.convert([layout]);

        expect(node.type).toBe("object");
        expect(node.input).toBe(layout);
        expect(node.children.map(child => child.path)).toEqual([
            "layout/value",
            "layout/header",
            "layout/arrow",
            "layout/image"
        ]);

        const value = node.children[0];
        expect(value.type).toBe("radio");
        expect(value.renderer).toEqual({ name: "Webiny/RadioGroup", settings: {} });
        expect(value.children).toEqual([]);
        expect(value.input.defaultValue).toBe("1");
        expect((value.input as any).options.map((o: any) => o.inputs)).toEqual([
            undefined,
            undefined,
            undefined,
            undefined
        ]);
    });

    it("gives each option's own definitions at the shared paths", () => {
        const [node] = ComponentManifestToAstConverter.convert([layout]);

        const three = ComponentManifestToAstConverter.convertRadioOptionInputs(node, "3");
        expect(three.map(child => [child.path, child.input.label])).toEqual([
            ["layout/header", "Headline"],
            ["layout/arrow", "Button"]
        ]);

        const four = ComponentManifestToAstConverter.convertRadioOptionInputs(node, "4");
        expect(four[0].renderer).toEqual({ name: "Webiny/Input", settings: { maxLength: 64 } });
        expect(ComponentManifestToAstConverter.convertRadioOptionInputs(node, "9")).toEqual([]);
    });

    it("throws when copies of a name disagree on what is stored", () => {
        const clash = createRadioInput({
            name: "layout",
            options: [
                { value: "1", inputs: [createTextInput({ name: "header", translatable: true })] },
                { value: "2", inputs: [createTextInput({ name: "header" })] }
            ]
        });

        expect(() => ComponentManifestToAstConverter.convert([clash])).toThrow(
            /"header" has a different "translatable" in options "1" and "2"/
        );

        const typeClash = createRadioInput({
            name: "layout",
            options: [
                { value: "1", inputs: [createTextInput({ name: "header" })] },
                { value: "2", inputs: [createColorInput({ name: "header" })] }
            ]
        });
        expect(() => ComponentManifestToAstConverter.convert([typeClash])).toThrow(/"type"/);

        const defaultClash = createRadioInput({
            name: "layout",
            options: [
                { value: "1", inputs: [createTextInput({ name: "header", defaultValue: "a" })] },
                { value: "2", inputs: [createTextInput({ name: "header", defaultValue: "b" })] }
            ]
        });
        expect(() => ComponentManifestToAstConverter.convert([defaultClash])).toThrow(
            /"defaultValue"/
        );
    });

    it("refuses an option input named value", () => {
        const named = createRadioInput({
            name: "layout",
            options: [{ value: "1", inputs: [createTextInput({ name: "value" })] }]
        });
        expect(() => ComponentManifestToAstConverter.convert([named])).toThrow(/"value"/);
    });

    it("writes the defaults of the value and every option input on create", () => {
        const factory = new ElementFactory({ [root.name]: root, [banner.name]: banner });
        const result = factory.createElementFromComponent({
            componentName: banner.name,
            parentId: "root",
            slot: "children"
        });
        const document = createDocument();
        result.operations.forEach(op => op.apply(document));

        const inputs = document.bindings[result.element.id]!.inputs!;
        expect(inputs["layout/value"]).toMatchObject({ static: "1", type: "radio" });
        expect(inputs["layout/header"]).toMatchObject({
            static: "Enter header text",
            translatable: true
        });
        expect(inputs["layout/arrow"]?.static).toBe("");
        expect(inputs["layout/image"]?.static).toBe("");
        expect(inputs["layout"]).toBeUndefined();
        expect(inputs["alignment"]?.static).toBe("center");
    });

    it("round-trips the bindings and keeps a shared input across an option switch", () => {
        const ast = ComponentManifestToAstConverter.convert(banner.inputs!);
        const bindings: DocumentElementBindings = {
            inputs: {
                "layout/value": { id: "v", static: "1", type: "radio" },
                "layout/header": { id: "h", static: "Hello", type: "text", translatable: true },
                "layout/arrow": { id: "a", static: "#fff", type: "color" },
                alignment: { id: "al", static: "center", type: "radio" }
            }
        };
        const processor = new InputsBindingsProcessor("el", ast, ["desktop"], bindings, {} as any);

        const deep = processor.toDeepInputs(bindings.inputs!);
        expect(deep).toEqual({
            layout: { value: "1", header: "Hello", arrow: "#fff" },
            alignment: "center"
        });

        // Switch to option 3: the renderer writes only `value`.
        const update = processor.createUpdate(
            { ...deep, layout: { ...deep.layout, value: "3" } },
            "desktop"
        );
        const document: any = { bindings: { el: { inputs: {}, styles: {} } } };
        update.applyToDocument(document);

        const inputs = document.bindings.el.inputs;
        expect(inputs["layout/value"]).toMatchObject({ id: "v", static: "3" });
        expect(inputs["layout/header"]).toMatchObject({ id: "h", static: "Hello" });
        expect(inputs["layout/arrow"]).toMatchObject({ id: "a", static: "#fff" });
        expect(inputs.alignment.static).toBe("center");
    });

    it("gives renderers the selected option and its inputs", () => {
        const [node, scalar] = ComponentManifestToAstConverter.convert(banner.inputs!);

        expect(hasRadioOptionInputs(node)).toBe(true);
        expect(hasRadioOptionInputs(scalar)).toBe(false);
        expect(getSelectedRadioValue(node, {})).toBe("1");
        expect(
            getSelectedRadioValue(node, { "layout/value": { id: "v", static: "3", type: "radio" } })
        ).toBe("3");
        expect(getRadioOptionNodes(node, "3").map(child => child.input.label)).toEqual([
            "Headline",
            "Button"
        ]);
        expect(getRadioOptionNodes(node, undefined)).toEqual([]);
        expect(withRadioValue({ value: "1", header: "Hi" }, "2")).toEqual({
            value: "2",
            header: "Hi"
        });
    });
});
