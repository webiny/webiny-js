import { describe, it, expect } from "vitest";
import { ElementFactory } from "./ElementFactory.js";
import { BindingsResolver } from "./BindingsResolver.js";
import { ComponentManifestToAstConverter } from "./ComponentManifestToAstConverter.js";
import type { ComponentInput, ComponentManifest, Document } from "~/types.js";

/**
 * Object-list inputs placed from a manifest, checked on what a page renders rather than on the
 * operations written: every case applies the factory's operations to a document and resolves the
 * element the way the renderer does.
 */

const text = (name: string, defaultValue?: string): ComponentInput =>
    ({ type: "text", renderer: "Webiny/Input", name, label: name, defaultValue }) as ComponentInput;

const cardFields: ComponentInput[] = [text("title", "New card"), text("body")];

const root: ComponentManifest = {
    name: "Webiny/Root",
    label: "Root",
    tags: [],
    inputs: [
        {
            type: "slot",
            list: true,
            renderer: "Webiny/Slot",
            defaultValue: [],
            name: "children"
        } as ComponentInput
    ]
};

const place = (manifest: ComponentManifest, inputs?: Record<string, any>) => {
    const components = { [root.name]: root, [manifest.name]: manifest };
    const result = new ElementFactory(components).createElementFromComponent({
        componentName: manifest.name,
        parentId: "root",
        slot: "children",
        bindings: inputs ? { inputs } : undefined
    });

    const document = {
        state: {},
        elements: {
            root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Root" } }
        },
        bindings: {}
    } as unknown as Document;

    for (const op of result.operations) {
        op.apply(document);
    }

    const [resolved] = new BindingsResolver(document.state).resolveElement({
        element: document.elements[result.element.id],
        elementBindings: document.bindings[result.element.id],
        inputAst: ComponentManifestToAstConverter.convert(manifest.inputs ?? [])
    });

    return resolved.inputs;
};

describe("ElementFactory — object-list defaults", () => {
    it("binds items from the manifest's defaults.inputs", () => {
        const manifest: ComponentManifest = {
            name: "Test/Cards",
            label: "Cards",
            tags: [],
            inputs: [
                {
                    type: "object",
                    renderer: "Webiny/Object",
                    name: "cards",
                    list: true,
                    fields: cardFields
                } as ComponentInput
            ],
            defaults: {
                inputs: {
                    cards: [
                        { title: "One", body: "First" },
                        { title: "Two", body: "Second" }
                    ]
                }
            }
        };

        expect(place(manifest).cards).toEqual([
            { title: "One", body: "First" },
            { title: "Two", body: "Second" }
        ]);
    });

    it("binds items from the input's own defaultValue when the manifest has no defaults", () => {
        const manifest: ComponentManifest = {
            name: "Test/Cards",
            label: "Cards",
            tags: [],
            inputs: [
                {
                    type: "object",
                    renderer: "Webiny/Object",
                    name: "cards",
                    list: true,
                    fields: cardFields,
                    defaultValue: [{ title: "Default", body: "From the input" }]
                } as ComponentInput
            ]
        };

        expect(place(manifest).cards).toEqual([{ title: "Default", body: "From the input" }]);
    });

    it("binds nested object lists inside list items", () => {
        const manifest: ComponentManifest = {
            name: "Test/Columns",
            label: "Columns",
            tags: [],
            inputs: [
                {
                    type: "object",
                    renderer: "Webiny/Object",
                    name: "columns",
                    list: true,
                    fields: [
                        text("heading"),
                        {
                            type: "object",
                            renderer: "Webiny/Object",
                            name: "links",
                            list: true,
                            fields: [text("label"), text("url")]
                        } as ComponentInput
                    ]
                } as ComponentInput
            ],
            defaults: {
                inputs: {
                    columns: [
                        {
                            heading: "Product",
                            links: [
                                { label: "Pricing", url: "/pricing" },
                                { label: "Docs", url: "/docs" }
                            ]
                        },
                        { heading: "Legal", links: [{ label: "Terms", url: "/terms" }] }
                    ]
                }
            }
        };

        expect(place(manifest).columns).toEqual([
            {
                heading: "Product",
                links: [
                    { label: "Pricing", url: "/pricing" },
                    { label: "Docs", url: "/docs" }
                ]
            },
            { heading: "Legal", links: [{ label: "Terms", url: "/terms" }] }
        ]);
    });

    it("resolves an empty object-list default to an empty list, not undefined", () => {
        const manifest: ComponentManifest = {
            name: "Test/Cards",
            label: "Cards",
            tags: [],
            inputs: [
                {
                    type: "object",
                    renderer: "Webiny/Object",
                    name: "cards",
                    list: true,
                    fields: cardFields,
                    defaultValue: []
                } as ComponentInput
            ]
        };

        expect(place(manifest).cards).toEqual([]);
    });

    it("binds an object list declared without fields", () => {
        const manifest: ComponentManifest = {
            name: "Test/Points",
            label: "Points",
            tags: [],
            inputs: [
                {
                    type: "object",
                    renderer: "Webiny/Object",
                    name: "points",
                    list: true,
                    fields: []
                } as ComponentInput
            ],
            defaults: {
                inputs: {
                    points: [
                        { x: 1, y: 2 },
                        { x: 3, y: 4 }
                    ]
                }
            }
        };

        expect(place(manifest).points).toEqual([
            { x: 1, y: 2 },
            { x: 3, y: 4 }
        ]);
    });

    it("still prefers explicit bindings over every default", () => {
        const manifest: ComponentManifest = {
            name: "Test/Cards",
            label: "Cards",
            tags: [],
            inputs: [
                {
                    type: "object",
                    renderer: "Webiny/Object",
                    name: "cards",
                    list: true,
                    fields: cardFields,
                    defaultValue: [{ title: "Default", body: "From the input" }]
                } as ComponentInput
            ],
            defaults: { inputs: { cards: [{ title: "Manifest", body: "From defaults" }] } }
        };

        expect(place(manifest, { cards: [{ title: "Given", body: "Explicit" }] }).cards).toEqual([
            { title: "Given", body: "Explicit" }
        ]);
    });
});
