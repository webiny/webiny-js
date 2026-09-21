import { describe, expect, it } from "vitest";
import {
    createLongTextInput,
    createNumberInput,
    createObjectInput,
    createTextInput
} from "@webiny/website-builder-sdk";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { scalarInputNames } from "./scalarInputNames.js";

const manifest = (inputs: unknown[]): ComponentManifest =>
    ({ name: "Custom/Thing", inputs, tags: [] }) as ComponentManifest;

describe("scalarInputNames", () => {
    it("accepts the scalar text and number inputs", () => {
        const names = scalarInputNames(
            manifest([
                createTextInput({ name: "title", label: "Title" }),
                createLongTextInput({ name: "body", label: "Body" }),
                createNumberInput({ name: "columns", label: "Columns" })
            ])
        );

        expect([...names].sort()).toEqual(["body", "columns", "title"]);
    });

    it("excludes a list input, which would throw if handed a string", () => {
        const names = scalarInputNames(
            manifest([
                createTextInput({ name: "title", label: "Title" }),
                createObjectInput({
                    name: "cards",
                    label: "Cards",
                    list: true,
                    fields: [createTextInput({ name: "heading", label: "Heading" })]
                })
            ])
        );

        expect(names.has("title")).toBeTrue();
        expect(names.has("cards")).toBeFalse();
    });

    it("excludes a composite input even when it is not a list", () => {
        const names = scalarInputNames(
            manifest([
                createObjectInput({
                    name: "cta",
                    label: "CTA",
                    fields: [
                        createTextInput({ name: "label", label: "Label" }),
                        createTextInput({ name: "url", label: "URL" })
                    ]
                })
            ])
        );

        expect(names.has("cta")).toBeFalse();
    });

    it("excludes input kinds a derived string cannot stand in for", () => {
        const names = scalarInputNames(
            manifest([
                { name: "image", type: "file" },
                { name: "children", type: "slot" },
                { name: "labels", type: "tags" }
            ])
        );

        expect(names.size).toBe(0);
    });

    it("survives a manifest with no inputs at all", () => {
        expect(scalarInputNames(manifest([])).size).toBe(0);
        // A manifest whose `inputs` never made it out of the source at all.
        expect(scalarInputNames({ name: "X", tags: [] } as unknown as ComponentManifest).size).toBe(
            0
        );
    });
});
