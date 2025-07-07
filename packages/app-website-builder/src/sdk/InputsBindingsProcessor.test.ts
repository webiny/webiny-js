import { InputsBindingsProcessor } from "./InputBindingsProcessor";
import type { InputAstNode } from "~/sdk/ComponentManifestToAstConverter";
import type { DocumentElementBindings } from "~/sdk/types";
import { ElementFactory } from "~/sdk/ElementFactory";

describe("InputsBindingsProcessor", () => {
    // Example simple AST (you can expand as needed)
    const simpleAst: InputAstNode[] = [
        {
            name: "title",
            type: "text",
            list: false,
            path: "title",
            children: [],
            input: {
                type: "text",
                name: "title",
                label: "Title"
            }
        },
        {
            name: "items",
            type: "object",
            list: true,
            path: "items",
            children: [
                {
                    name: "label",
                    type: "text",
                    list: false,
                    path: "items.label",
                    children: [],
                    input: {
                        type: "text",
                        name: "label",
                        label: "Label"
                    }
                }
            ],
            input: {
                type: "object",
                name: "items",
                list: true,
                fields: [
                    {
                        type: "text",
                        name: "label",
                        label: "Label"
                    }
                ]
            }
        }
    ];

    const withSlotAst: InputAstNode[] = [
        {
            path: "children",
            children: [],
            name: "children",
            type: "slot",
            list: false,
            input: {
                type: "slot",
                name: "children",
                label: "Children"
            }
        }
    ];

    const breakpoints = ["desktop", "tablet", "mobile"];

    const baseBindings: DocumentElementBindings = {
        inputs: {
            title: { id: "title", static: "Base Title", type: "text" },
            "items/0/label": {
                id: "label0",
                static: "Base Label 1",
                type: "text"
            },
            "items/1/label": {
                id: "label1",
                static: "Base Label 2",
                type: "text"
            }
        },
        styles: {}
    };

    const overrides: DocumentElementBindings["overrides"] = {
        tablet: {
            inputs: {
                title: { id: "title", static: "Tablet Title", type: "text" },
                "items/0/label": {
                    id: "label0",
                    static: "Tablet Label 1",
                    type: "text"
                }
            }
        },
        mobile: {
            inputs: {
                title: { id: "title", static: "Mobile Title", type: "text" }
            }
        }
    };

    const getInputsBindingsProcessor = (
        bindings: DocumentElementBindings = baseBindings,
        ast = simpleAst
    ) => {
        const elementFactory = new ElementFactory({
            "Webiny/GridColumn": {
                name: "Webiny/GridColumn",
                label: "Column",
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
            }
        });
        const processor = new InputsBindingsProcessor(
            "elementId",
            ast,
            breakpoints,
            bindings,
            elementFactory
        );

        return { processor, bindings };
    };

    it("toDeep should convert flat bindings to nested object", () => {
        const { processor } = getInputsBindingsProcessor();

        const deep = processor.toDeepInputs(baseBindings.inputs ?? {});
        expect(deep).toEqual({
            title: "Base Title",
            items: [{ label: "Base Label 1" }, { label: "Base Label 2" }]
        });
    });

    it("applyInputs should assign base breakpoint inputs correctly", () => {
        const { processor } = getInputsBindingsProcessor();

        const newInputs = {
            title: "New Base Title",
            items: [{ label: "New Label 1" }, { label: "New Label 2" }]
        };

        const updater = processor.createUpdate(newInputs, "mobile");
        const rebuilt: any = { bindings: { elementId: { inputs: {}, styles: {} } } };
        updater.applyToDocument(rebuilt);

        const elementBindings = rebuilt.bindings.elementId;

        expect(elementBindings.inputs.title.static).toBe("New Base Title");
        expect(elementBindings.inputs["items/0/label"].static).toBe("New Label 1");
        expect(elementBindings.inputs["items/1/label"].static).toBe("New Label 2");
        expect(elementBindings.overrides).toBeUndefined();
    });

    it("applyInputs should assign overrides correctly, skipping inherited values", () => {
        const rawBindings: DocumentElementBindings = {
            inputs: baseBindings.inputs,
            overrides,
            styles: {}
        };
        const { processor } = getInputsBindingsProcessor(rawBindings);

        const newInputs = {
            title: "Mobile Title",
            items: [{ label: "Base Label 1" }, { label: "Base Label 2" }]
        };

        const updater = processor.createUpdate(newInputs, "mobile");
        const rebuilt: any = { bindings: { elementId: { inputs: {}, styles: {} } } };
        updater.applyToDocument(rebuilt);

        const elementBindings = rebuilt.bindings.elementId;

        expect(elementBindings.inputs.title.static).toBe("Mobile Title");
        // Items are same as base, so should not be in overrides
        expect(elementBindings.overrides?.mobile.inputs?.["items/0/label"]).toBeUndefined();
    });

    it("createPatch should create correct json patch for input changes", () => {
        const rawBindings: DocumentElementBindings = {
            inputs: baseBindings.inputs,
            overrides,
            styles: {}
        };
        const { processor, bindings } = getInputsBindingsProcessor(rawBindings);

        const newInputs = {
            title: "Changed Title",
            items: [{ label: "Changed Label 1" }]
        };

        const updater = processor.createUpdate(newInputs, "mobile");
        const patch = updater.createJsonPatch(bindings);

        // You're seeing the weird `~1` delimiter because that's what fast-json-patch does with indexes.
        expect(patch).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    op: "remove",
                    path: "/inputs/items~11~1label"
                }),
                expect.objectContaining({
                    op: "replace",
                    path: "/inputs/title/static",
                    value: "Changed Title"
                }),
                expect.objectContaining({
                    op: "replace",
                    path: "/inputs/items~10~1label/static",
                    value: "Changed Label 1"
                })
            ])
        );
    });

    it("applyInputs removes keys missing in new inputs", () => {
        const rawBindings: DocumentElementBindings = {
            inputs: {
                ...baseBindings.inputs,
                "some/key": { id: "someKey", static: "toRemove", type: "text" }
            },
            overrides,
            styles: {}
        };
        const { processor } = getInputsBindingsProcessor(rawBindings);

        const newInputs = {
            title: "Base Title",
            items: [{ label: "Base Label 1" }, { label: "Base Label 2" }]
        };

        const updater = processor.createUpdate(newInputs, "mobile");
        const rebuilt: any = { bindings: { elementId: { inputs: {}, styles: {} } } };
        updater.applyToDocument(rebuilt);

        const elementBindings = rebuilt.bindings.elementId;

        expect(elementBindings.inputs["some/key"]).toBeUndefined();
    });

    it("createUpdate should apply correct changes to the document", () => {
        const rawBindings: DocumentElementBindings = {
            inputs: baseBindings.inputs,
            overrides,
            styles: {}
        };
        const { processor } = getInputsBindingsProcessor(rawBindings, [
            ...simpleAst,
            ...withSlotAst
        ]);

        const deepInputs = processor.toDeepInputs(rawBindings.inputs!);

        deepInputs.items.push({ label: "New Label 1" });
        deepInputs.children = {
            action: "CreateElement",
            params: {
                component: "Webiny/GridColumn"
            }
        };

        const updater = processor.createUpdate(deepInputs, "mobile");
        const rebuilt: any = { bindings: { elementId: { inputs: {}, styles: {} } }, elements: {} };
        updater.applyToDocument(rebuilt);

        expect(rebuilt.bindings.elementId.inputs).toMatchObject({
            title: { id: "title", static: "Base Title", type: "text" },
            "items/0/label": {
                id: "label0",
                static: "Base Label 1",
                type: "text"
            },
            "items/1/label": {
                id: "label1",
                static: "Base Label 2",
                type: "text"
            },
            "items/2/label": {
                id: expect.any(String),
                static: "New Label 1",
                type: "text"
            },
            children: {
                id: expect.any(String),
                static: expect.any(String),
                type: "slot"
            }
        });
    });
});
