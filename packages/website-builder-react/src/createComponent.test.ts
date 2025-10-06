import { describe, expect, it } from "vitest";
import type { ComponentProps, ExtractInputNames } from "~/types.js";
import { createComponent } from "~/createComponent.js";
import { createTextInput } from "~/index.js";
import { createSlotInput } from "@webiny/website-builder-sdk";

/**
 * These tests are aimed at testing TS types rather than functionality itself.
 * // TODO: figure out how to enable typechecking for a single test. Currently it only typechecks at build time.
 */

describe("Component Manifest", () => {
    it("should support input arrays and strict input objects", () => {
        // eslint-disable-next-line
        const Button = (_: ComponentProps<{ title: string; children: React.ReactNode }>) => {
            return null;
        };

        type Inputs = ExtractInputNames<typeof Button>;

        const button1 = createComponent(Button, {
            name: "Button",
            inputs: [
                // Passing a generic narrows down the `name` property and provides autocomplete.
                createTextInput<Inputs>({
                    name: "title",
                    label: "Title"
                }),
                // Skipping the generic still performs typechecks, but doesn't provide autocomplete.
                createSlotInput({
                    name: "children"
                })
            ]
        });

        const button2 = createComponent(Button, {
            name: "Button",
            inputs: {
                title: createTextInput({
                    label: "Title"
                }),
                children: createSlotInput({})
            }
        });

        const snapshot = {
            name: "Button",
            inputs: [
                {
                    type: "text",
                    label: "Title",
                    renderer: "Webiny/Input",
                    name: "title"
                },
                {
                    type: "slot",
                    renderer: "Webiny/Slot",
                    name: "children",
                    list: true,
                    defaultValue: []
                }
            ]
        };

        expect(button1.manifest).toEqual(snapshot);
        expect(button2.manifest).toEqual(snapshot);
    });

    it("acceptsChildren should satisfy the `children` input requirement", () => {
        // eslint-disable-next-line
        const Button = (_: ComponentProps<{ children: React.ReactNode }>) => {
            return null;
        };

        const { manifest } = createComponent(Button, {
            name: "Button",
            acceptsChildren: true
        });

        expect(manifest).toEqual({
            name: "Button",
            acceptsChildren: true,
            inputs: [
                {
                    type: "slot",
                    list: true,
                    renderer: "Webiny/Slot",
                    name: "children",
                    defaultValue: []
                }
            ]
        });
    });

    it("`acceptsChildren` should work alongside other inputs", () => {
        // eslint-disable-next-line
        const Button = (_: ComponentProps<{ title: string; children: React.ReactNode }>) => {
            return null;
        };

        // Inputs as array
        const button1 = createComponent(Button, {
            name: "Button",
            acceptsChildren: true,
            inputs: [
                createTextInput({
                    name: "title",
                    label: "Title"
                })
            ]
        });

        // Inputs as object
        const button2 = createComponent(Button, {
            name: "Button",
            acceptsChildren: true,
            inputs: {
                title: createTextInput({
                    label: "Title"
                })
            }
        });

        // Both must produce the same component manifest
        const snapshot = {
            name: "Button",
            acceptsChildren: true,
            inputs: [
                {
                    type: "text",
                    renderer: "Webiny/Input",
                    name: "title",
                    label: "Title"
                },
                {
                    type: "slot",
                    renderer: "Webiny/Slot",
                    name: "children",
                    list: true,
                    defaultValue: []
                }
            ]
        };

        expect(button1.manifest).toEqual(snapshot);
        expect(button2.manifest).toEqual(snapshot);
    });
});
