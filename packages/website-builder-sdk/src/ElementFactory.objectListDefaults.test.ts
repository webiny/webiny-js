import { describe, it, expect } from "vitest";
import { ElementFactory } from "./ElementFactory.js";
import { BindingsResolver } from "./BindingsResolver.js";
import { ComponentManifestToAstConverter } from "./ComponentManifestToAstConverter.js";
import {
    createFileInput,
    createLongTextInput,
    createObjectInput,
    createTextInput
} from "./createInput.js";
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

    /*
     * The shape the migration pipeline's generated components use: inputs built by the SDK's own
     * factories (the bundler evaluates `createObjectInput({ list: true, fields: [...] })` descriptors),
     * a file input and a nested object inside each item, and the list items given in the manifest's
     * `defaults.inputs` as the generation prompt instructs.
     */
    it("binds a generated component's list items from defaults.inputs, file and nested fields included", () => {
        const image = {
            id: "img-1",
            name: "pool.jpg",
            size: 1024,
            mimeType: "image/jpeg",
            src: "https://cdn.example.com/pool.jpg",
            width: 1200,
            height: 800
        };
        const manifest: ComponentManifest = {
            name: "Custom/AmenitiesGrid",
            label: "Amenities Grid",
            tags: [],
            inputs: [
                createTextInput({ name: "heading", label: "Heading", defaultValue: "Amenities" }),
                createObjectInput({
                    name: "amenities",
                    label: "Amenities",
                    list: true,
                    fields: [
                        createTextInput({ name: "title", label: "Title", defaultValue: "Amenity" }),
                        createLongTextInput({ name: "description", label: "Description" }),
                        createFileInput({
                            name: "image",
                            label: "Image",
                            allowedFileTypes: ["image/*"]
                        }),
                        createObjectInput({
                            name: "link",
                            label: "Link",
                            fields: [
                                createTextInput({ name: "label", label: "Label" }),
                                createTextInput({ name: "url", label: "URL" })
                            ]
                        })
                    ]
                })
            ] as ComponentInput[],
            defaults: {
                inputs: {
                    amenities: [
                        {
                            title: "Resort-style pool",
                            description: "Heated, open year-round.",
                            image,
                            link: { label: "See the pool", url: "/amenities#pool" }
                        },
                        {
                            title: "Fitness center",
                            description: "Open 24/7.",
                            image: {
                                ...image,
                                id: "img-2",
                                src: "https://cdn.example.com/gym.jpg"
                            },
                            link: { label: "See the gym", url: "/amenities#gym" }
                        },
                        {
                            title: "Pet spa",
                            description: "Wash and groom.",
                            image: {
                                ...image,
                                id: "img-3",
                                src: "https://cdn.example.com/spa.jpg"
                            },
                            link: { label: "See the spa", url: "/amenities#spa" }
                        }
                    ]
                }
            }
        };

        const inputs = place(manifest);

        expect(inputs.amenities).toEqual(manifest.defaults!.inputs!.amenities);
        // Scalar inputs not in defaults.inputs fall back to their own defaultValue.
        expect(inputs.heading).toBe("Amenities");
    });
});
