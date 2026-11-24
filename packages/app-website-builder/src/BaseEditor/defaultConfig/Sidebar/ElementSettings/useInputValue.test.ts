import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { toJS } from "mobx";
import {
    ComponentManifestToAstConverter,
    createBooleanInput,
    createRadioInput,
    createTextInput
} from "@webiny/website-builder-sdk";
import { Editor } from "~/editorSdk/Editor.js";
import { useInputValue } from "./useInputValue.js";

// The editor in context, without `DocumentEditor`'s providers (they load the whole admin).
const current = vi.hoisted(() => ({ editor: undefined as unknown }));
vi.mock("~/DocumentEditor/index.js", () => ({
    useDocumentEditor: () => current.editor
}));

// The theme's breakpoints come from the admin's theme provider. "desktop" is the base breakpoint.
const active = vi.hoisted(() => ({ breakpoint: "desktop" }));
vi.mock("~/BaseEditor/hooks/useBreakpoint.js", () => {
    const breakpoints = [
        { name: "desktop", title: "Desktop", minWidth: 0, maxWidth: 4000 },
        { name: "mobile", title: "Mobile", minWidth: 0, maxWidth: 767 }
    ];
    return {
        useBreakpoint: () => ({
            breakpoint: breakpoints.find(bp => bp.name === active.breakpoint)!,
            breakpoints
        })
    };
});

const ast = ComponentManifestToAstConverter.convert([
    createTextInput({ name: "altText" }),
    createBooleanInput({ name: "highPriority" }),
    createBooleanInput({ name: "lazyLoad" }),
    createTextInput({ name: "caption", responsive: true }),
    createRadioInput({
        name: "layout",
        defaultValue: "1",
        options: [
            {
                value: "1",
                label: "One",
                inputs: [createTextInput({ name: "header" })]
            },
            {
                value: "3",
                label: "Three",
                inputs: [createTextInput({ name: "header" })]
            }
        ]
    })
]);
vi.mock("~/BaseEditor/hooks/useElementInputsAst.js", () => ({
    useElementInputsAst: () => ast
}));

const [altTextNode, highPriorityNode, lazyLoadNode, captionNode, layoutNode] = ast;

function createEditor() {
    return new Editor({
        id: "page",
        properties: {},
        elements: {
            image: {
                id: "image",
                type: "Webiny/Element",
                component: { name: "Acme/Image" }
            }
        },
        bindings: { image: { inputs: {} } }
    } as any);
}

function renderInputs() {
    current.editor = createEditor();
    const { result } = renderHook(() => ({
        altText: useInputValue("image", altTextNode),
        highPriority: useInputValue("image", highPriorityNode),
        lazyLoad: useInputValue("image", lazyLoadNode),
        caption: useInputValue("image", captionNode),
        layout: useInputValue("image", layoutNode)
    }));
    return result;
}

const storedInputs = () => {
    const editor = current.editor as Editor;
    return toJS(editor.getDocumentState().read().bindings.image.inputs);
};

// Commits run in a `setTimeout`; let the queued ones run.
const flushCommits = () => act(() => new Promise(resolve => setTimeout(resolve, 10)));

afterEach(() => {
    cleanup();
    active.breakpoint = "desktop";
});

// webiny-js#6189: one click can queue two commits from the same render (a text field's blur and
// the clicked switch's change). The second must not write back the first input's old value.
describe("useInputValue: commits queued from the same render", () => {
    it("keeps a text edit when a switch of the same element changes in the same task", async () => {
        const result = renderInputs();
        const { altText, highPriority } = result.current;

        altText.onChange(({ value }) => value.set("A loaf of bread"));
        highPriority.onChange(({ value }) => value.set(true));
        await flushCommits();

        expect(storedInputs()?.altText?.static).toBe("A loaf of bread");
        expect(storedInputs()?.highPriority?.static).toBe(true);
    });

    it("keeps both of two switches changed in the same task", async () => {
        const result = renderInputs();
        const { highPriority, lazyLoad } = result.current;

        highPriority.onChange(({ value }) => value.set(true));
        lazyLoad.onChange(({ value }) => value.set(true));
        await flushCommits();

        expect(storedInputs()?.highPriority?.static).toBe(true);
        expect(storedInputs()?.lazyLoad?.static).toBe(true);
    });

    it("stores a new input's metadata under the id of the binding it creates", async () => {
        const result = renderInputs();

        result.current.highPriority.onChange(({ value, metadata }) => {
            value.set(true);
            metadata.set("source", "switch");
        });
        await flushCommits();

        const editor = current.editor as Editor;
        const bindings = toJS(editor.getDocumentState().read().bindings.image);
        const id = bindings.inputs?.highPriority?.id;
        expect(id).toBeTruthy();
        expect(bindings.metadata).toEqual({ [`inputs/${id}/source`]: "switch" });
    });

    it("keeps a breakpoint override's id, and its metadata, across commits without a base binding", async () => {
        active.breakpoint = "mobile";
        const result = renderInputs();

        result.current.caption.onChange(({ value }) => value.set("Small"));
        await flushCommits();
        result.current.caption.onChange(({ value, metadata }) => {
            value.set("Smaller");
            metadata.set("source", "second");
        });
        await flushCommits();

        const editor = current.editor as Editor;
        const bindings = toJS(editor.getDocumentState().read().bindings.image);
        const override = bindings.overrides?.mobile?.inputs?.caption;
        expect(override?.static).toBe("Smaller");
        // Responsive metadata is stored per breakpoint.
        expect(bindings.metadata).toEqual({
            [`inputs/${override?.id}/source/mobile`]: "second"
        });
    });

    it("gives renderers a leaf's static value, and a container's resolved object", async () => {
        const result = renderInputs();

        result.current.altText.onChange(({ value }) => value.set("A loaf of bread"));
        result.current.layout.onChange(({ value }) => value.set({ value: "3", header: "Hi" }));
        await flushCommits();

        expect(result.current.altText.staticValue).toBe("A loaf of bread");
        expect(result.current.layout.staticValue).toEqual({
            value: "3",
            header: "Hi"
        });
    });
});
