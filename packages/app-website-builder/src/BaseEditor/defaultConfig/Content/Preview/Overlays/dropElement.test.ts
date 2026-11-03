// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Editor } from "~/editorSdk/Editor.js";
import { Commands } from "~/BaseEditor/index.js";
import { $createElement, $moveElement } from "~/editorSdk/utils/index.js";
import { dropElement } from "./dropElement.js";

const slot = { name: "children", type: "slot", list: true };

function createEditor() {
    const editor = new Editor({
        id: "page",
        properties: {},
        state: {},
        elements: {
            root: { id: "root", type: "Webiny/Element", component: { name: "Webiny/Root" } }
        },
        bindings: { root: { inputs: { children: { type: "slot", list: true, static: [] } } } }
    } as any);
    editor.updateEditor(state => {
        state.components = {
            "Webiny/Root": { name: "Webiny/Root", label: "Root", inputs: [slot] },
            // A box whose slot takes only text.
            "Test/TextBox": {
                name: "Test/TextBox",
                label: "Text box",
                inputs: [{ ...slot, components: ["Test/Text"] }]
            },
            "Test/Image": { name: "Test/Image", label: "Image", inputs: [] },
            "Test/Text": {
                name: "Test/Text",
                label: "Text",
                inputs: [{ name: "text", type: "text" }],
                defaults: { inputs: { text: "Default" } }
            }
        } as any;
        state.viewport = { breakpoints: [{ name: "desktop" }] } as any;
    });
    editor.registerCommandHandler(Commands.CreateElement, payload => {
        $createElement(editor, payload);
    });
    // As Webiny's `MoveElement` command handler.
    editor.registerCommandHandler(Commands.MoveElement, payload => {
        const components = editor.getEditorState().read().components;
        editor.updateDocument(document => {
            $moveElement(document, { ...payload, components });
        });
    });
    return editor;
}

const target = { parentId: "root", slot: "children", index: 0 };

function droppedText(editor: Editor) {
    const document = editor.getDocumentState().read();
    const [id] = document.bindings.root.inputs!.children!.static as string[];
    return document.bindings[id].inputs!.text!.static;
}

describe("dropElement", () => {
    it("creates a dropped component with the bindings the drag item carries", () => {
        const editor = createEditor();

        dropElement(editor, {
            item: { componentName: "Test/Text", bindings: { inputs: { text: "Preset" } } },
            target
        });

        expect(droppedText(editor)).toBe("Preset");
    });

    it("uses the manifest's defaults when the item carries none", () => {
        const editor = createEditor();

        dropElement(editor, { item: { componentName: "Test/Text" }, target });

        expect(droppedText(editor)).toBe("Default");
    });

    it("moves a dragged element (an item with an id) to the target", () => {
        const editor = createEditor();
        dropElement(editor, { item: { componentName: "Test/Text" }, target });
        dropElement(editor, {
            item: { componentName: "Test/Image" },
            target: { ...target, index: 1 }
        });
        const children = () =>
            editor.getDocumentState().read().bindings.root.inputs!.children!.static as string[];
        const [text, image] = children();

        dropElement(editor, { item: { id: image, componentName: "Test/Image" }, target });

        expect(children()).toEqual([image, text]);
    });

    it("refuses a component the target slot doesn't take", () => {
        const editor = createEditor();
        dropElement(editor, { item: { componentName: "Test/TextBox" }, target });
        const [box] = editor.getDocumentState().read().bindings.root.inputs!.children!
            .static as string[];
        const boxTarget = { parentId: box, slot: "children", index: 0 };

        dropElement(editor, { item: { componentName: "Test/Image" }, target: boxTarget });
        const boxChildren = () =>
            (editor.getDocumentState().read().bindings[box].inputs?.children?.static ??
                []) as string[];
        expect(boxChildren()).toEqual([]);

        dropElement(editor, { item: { componentName: "Test/Text" }, target: boxTarget });
        expect(boxChildren()).toHaveLength(1);
    });
});
