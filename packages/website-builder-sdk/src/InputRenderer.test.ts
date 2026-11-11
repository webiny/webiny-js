import { describe, it, expect } from "vitest";
import { ComponentManifestToAstConverter } from "./ComponentManifestToAstConverter.js";
import {
    createLongTextInput,
    createNumberInput,
    createObjectInput,
    createRadioInput,
    createTextInput
} from "./createInput.js";
import type { ComponentInput } from "~/types.js";

describe("input renderer", () => {
    it("resolves a renderer name to an object with empty settings", () => {
        const [node] = ComponentManifestToAstConverter.convert([
            createTextInput({ name: "title" })
        ]);

        expect(node.renderer).toEqual({ name: "Webiny/Input", settings: {} });
    });

    it("keeps the settings of the object form, through the factories", () => {
        const input = createLongTextInput({
            name: "header",
            renderer: { name: "Webiny/Textarea", settings: { maxLength: 54, height: "66px" } }
        });

        // The factory's default renderer is replaced as a whole, so the name is never lost.
        expect(input.renderer).toEqual({
            name: "Webiny/Textarea",
            settings: { maxLength: 54, height: "66px" }
        });

        const [node] = ComponentManifestToAstConverter.convert([input]);
        expect(node.renderer).toEqual({
            name: "Webiny/Textarea",
            settings: { maxLength: 54, height: "66px" }
        });
        // The input is the author's, untouched.
        expect(node.input).toBe(input);
    });

    it("gives empty settings to an object form without settings", () => {
        const [node] = ComponentManifestToAstConverter.convert([
            createNumberInput({ name: "opacity", renderer: { name: "Acme/Slider" } })
        ]);

        expect(node.renderer).toEqual({ name: "Acme/Slider", settings: {} });
    });

    it("gives an empty name to an input without a renderer", () => {
        const input: ComponentInput = { name: "raw", type: "text" };
        const [node] = ComponentManifestToAstConverter.convert([input]);

        expect(node.renderer).toEqual({ name: "", settings: {} });
    });

    it("resolves the renderers of an object's children", () => {
        const [node] = ComponentManifestToAstConverter.convert([
            createObjectInput({
                name: "dropShadow",
                renderer: { name: "Acme/Group", settings: { collapsed: true } },
                fields: [
                    createNumberInput({
                        name: "opacity",
                        renderer: { name: "Acme/Slider", settings: { min: 0, max: 100 } }
                    }),
                    createTextInput({ name: "label" })
                ]
            })
        ]);

        expect(node.renderer).toEqual({ name: "Acme/Group", settings: { collapsed: true } });
        expect(node.children.map(child => child.renderer)).toEqual([
            { name: "Acme/Slider", settings: { min: 0, max: 100 } },
            { name: "Webiny/Input", settings: {} }
        ]);
    });

    it("gives a radio's value child the radio's renderer and settings", () => {
        const [node] = ComponentManifestToAstConverter.convert([
            createRadioInput({
                name: "layout",
                defaultValue: "1",
                renderer: { name: "Acme/ImageRadio", settings: { columns: 2 } },
                options: [
                    {
                        value: "1",
                        inputs: [
                            createTextInput({
                                name: "header",
                                renderer: { name: "Webiny/Input", settings: { maxLength: 54 } }
                            })
                        ]
                    },
                    {
                        value: "2",
                        inputs: [
                            createTextInput({
                                name: "header",
                                renderer: { name: "Webiny/Input", settings: { maxLength: 64 } }
                            })
                        ]
                    }
                ]
            })
        ]);

        expect(node.renderer).toEqual({ name: "Acme/ImageRadio", settings: { columns: 2 } });
        const [value, header] = node.children;
        expect(value.renderer).toEqual({ name: "Acme/ImageRadio", settings: { columns: 2 } });
        expect(header.renderer.settings).toEqual({ maxLength: 54 });

        // Settings may differ per option: each option's nodes carry their own.
        const two = ComponentManifestToAstConverter.convertRadioOptionInputs(node, "2");
        expect(two[0].renderer.settings).toEqual({ maxLength: 64 });
    });
});
