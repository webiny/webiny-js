import { describe, expect, it } from "vitest";
import { ComponentManifestToAstConverter } from "./ComponentManifestToAstConverter.js";
import { InputsBindingsProcessor } from "./InputBindingsProcessor.js";
import { ElementFactory } from "./ElementFactory.js";
import { createGlobalElementDocument } from "./createGlobalElementDocument.js";
import { createObjectInput, createTextInput } from "./createInput.js";
import { generateListItemId, LIST_ITEM_ID } from "./listItemId.js";
import type { ComponentManifest, Document, DocumentElementBindings } from "./types.js";

const inputs = [
    createTextInput({ name: "title" }),
    createObjectInput({
        name: "questions",
        list: true,
        fields: [
            createTextInput({ name: "question", translatable: true }),
            createObjectInput({
                name: "options",
                list: true,
                fields: [createTextInput({ name: "text", translatable: true })]
            })
        ]
    }),
    createObjectInput({ name: "single", fields: [createTextInput({ name: "label" })] })
];

const manifest = (global = false): ComponentManifest =>
    ({
        name: "Test/Survey",
        global,
        tags: [],
        inputs,
        defaults: {
            inputs: {
                questions: [
                    { question: "One", options: [{ text: "Yes" }, { text: "No" }] },
                    { question: "Two", options: [] }
                ]
            }
        }
    }) as unknown as ComponentManifest;

const statics = (bindings: DocumentElementBindings) =>
    Object.fromEntries(
        Object.entries(bindings.inputs ?? {}).map(([path, binding]) => [path, binding.static])
    );

describe("list item ids", () => {
    it("the AST gives every object list item a hidden `_id`, last; a plain object gets none", () => {
        const ast = ComponentManifestToAstConverter.convert(inputs);
        const questions = ast.find(node => node.name === "questions")!;
        expect(questions.children.map(child => child.name)).toEqual(["question", "options", "_id"]);
        const id = questions.children[2];
        expect(id).toMatchObject({ path: "questions/_id", listItemId: true, type: "text" });
        expect(id.input.hideFromUi).toBe(true);
        const options = questions.children[1];
        expect(options.children.map(child => child.path)).toEqual([
            "questions/options/text",
            "questions/options/_id"
        ]);
        const single = ast.find(node => node.name === "single")!;
        expect(single.children.map(child => child.name)).toEqual(["label"]);
    });

    it("keeps a manifest's own `_id` field", () => {
        const ast = ComponentManifestToAstConverter.convert([
            createObjectInput({
                name: "items",
                list: true,
                fields: [
                    createTextInput({ name: "_id", label: "Own" }),
                    createTextInput({ name: "a" })
                ]
            })
        ]);
        expect(ast[0].children.map(child => child.name)).toEqual(["_id", "a"]);
        expect(ast[0].children[0]).toMatchObject({ listItemId: true });
        expect(ast[0].children[0].input.label).toBe("Own");
    });

    it("a new element's default items (nested too) get ids; given ids are kept", () => {
        const factory = new ElementFactory({ "Test/Survey": manifest() });
        const document = { elements: {}, bindings: {} } as unknown as Document;
        const { element, operations } = factory.createElementFromComponent({
            componentName: "Test/Survey",
            parentId: "root",
            slot: "children",
            bindings: {
                inputs: {
                    questions: [{ question: "Kept", _id: "keptid", options: [{ text: "A" }] }]
                }
            }
        });
        document.elements.root = {
            id: "root",
            type: "Webiny/Element",
            component: { name: "x" }
        } as never;
        operations.forEach(operation => operation.apply(document));
        const values = statics(document.bindings[element.id]);
        expect(values["questions/0/_id"]).toBe("keptid");
        expect(values["questions/0/options/0/_id"]).toMatch(/^[a-z0-9]{12}$/);

        const defaults = new ElementFactory({ "Test/Survey": manifest() });
        const second = defaults.createElementFromComponent({
            componentName: "Test/Survey",
            parentId: "root",
            slot: "children"
        });
        const doc2 = {
            elements: { root: document.elements.root },
            bindings: {}
        } as unknown as Document;
        second.operations.forEach(operation => operation.apply(doc2));
        const ids = Object.entries(statics(doc2.bindings[second.element.id]))
            .filter(([path]) => path.endsWith("/_id"))
            .map(([, value]) => value);
        expect(ids).toHaveLength(4);
        expect(new Set(ids).size).toBe(4);
    });

    it("a global's default instance has the same item ids on every build", () => {
        const components = { "Test/Survey": manifest(true) };
        const a = createGlobalElementDocument("Test/Survey", components);
        const b = createGlobalElementDocument("Test/Survey", components);
        const id = "$global:Test/Survey";
        expect(statics(a.bindings[id])).toEqual(statics(b.bindings[id]));
        expect(statics(a.bindings[id])["questions/1/_id"]).toMatch(/^global-/);
    });

    it("an item keeps its id when another is removed or the list is reordered; a new item gets one", () => {
        const ast = ComponentManifestToAstConverter.convert(inputs);
        const factory = new ElementFactory({});
        const raw: DocumentElementBindings = {
            inputs: {
                "questions/0/question": { id: "b1", type: "text", static: "One" },
                "questions/0/_id": { id: "b2", type: "text", static: "aaaaaaaaaaaa" },
                "questions/1/question": { id: "b3", type: "text", static: "Two" },
                "questions/1/_id": { id: "b4", type: "text", static: "bbbbbbbbbbbb" },
                "questions/2/question": { id: "b5", type: "text", static: "Three" },
                "questions/2/_id": { id: "b6", type: "text", static: "cccccccccccc" }
            }
        };
        const processor = new InputsBindingsProcessor("el", ast, ["desktop"], raw, factory);
        const deep = processor.toDeepInputs(raw.inputs!);
        expect(deep.questions.map((item: any) => item._id)).toEqual([
            "aaaaaaaaaaaa",
            "bbbbbbbbbbbb",
            "cccccccccccc"
        ]);

        // Remove the first, move the last up, add one without an id.
        deep.questions = [deep.questions[2], deep.questions[1], { question: "New" }];
        const document = {
            elements: {},
            bindings: { el: structuredClone(raw) }
        } as unknown as Document;
        processor.createUpdate(deep, "desktop").applyToDocument(document);
        const values = statics(document.bindings.el);
        expect(values["questions/0/question"]).toBe("Three");
        expect(values["questions/0/_id"]).toBe("cccccccccccc");
        expect(values["questions/1/_id"]).toBe("bbbbbbbbbbbb");
        expect(values["questions/2/question"]).toBe("New");
        expect(values["questions/2/_id"]).toMatch(/^[a-z0-9]{12}$/);
        expect(values["questions/2/_id"]).not.toBe("cccccccccccc");
    });

    it("generates 12 lowercase letters and digits", () => {
        expect(generateListItemId()).toMatch(/^[a-z0-9]{12}$/);
        expect(LIST_ITEM_ID).toBe("_id");
    });
});
