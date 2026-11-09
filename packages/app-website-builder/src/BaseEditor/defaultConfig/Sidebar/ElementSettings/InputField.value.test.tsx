import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
    ComponentManifestToAstConverter,
    createRadioInput,
    createTextInput
} from "@webiny/website-builder-sdk";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import type { ElementInputRendererProps } from "~/BaseEditor/config/ElementInput.js";
import { Editor } from "~/editorSdk/Editor.js";
import { InputField } from "./InputField.js";

// What `InputField` hands the renderer, with the real `useInputValue` reading an editor document.
const current = vi.hoisted(() => ({ editor: undefined as unknown }));
vi.mock("~/DocumentEditor/index.js", () => ({
    useDocumentEditor: () => current.editor
}));
vi.mock("~/BaseEditor/hooks/useBreakpoint.js", () => {
    const breakpoint = {
        name: "desktop",
        title: "Desktop",
        minWidth: 0,
        maxWidth: 4000
    };
    return { useBreakpoint: () => ({ breakpoint, breakpoints: [breakpoint] }) };
});
vi.mock("./useInputRenderer.js", () => ({
    useInputRenderer: () => (props: ElementInputRendererProps) => (
        <div data-testid={"value"}>{JSON.stringify(props.value)}</div>
    )
}));
vi.mock("../InheritanceLabel.js", () => ({ InheritanceLabel: () => null }));

const ast = ComponentManifestToAstConverter.convert([
    createTextInput({ name: "title" }),
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

const element = {
    id: "banner",
    type: "Webiny/Element"
} as unknown as DocumentElement;

afterEach(() => cleanup());

describe("InputField value", () => {
    it("is a leaf's static value, and a radio with option inputs' resolved object", () => {
        current.editor = new Editor({
            id: "page",
            properties: {},
            elements: { banner: { ...element, component: { name: "Acme/Banner" } } },
            bindings: {
                banner: {
                    inputs: {
                        title: { id: "t", type: "text", static: "Hello" },
                        "layout/value": { id: "v", type: "radio", static: "3" },
                        "layout/header": { id: "h", type: "text", static: "Hi" }
                    }
                }
            }
        } as any);

        render(
            <>
                {ast.map(node => (
                    <InputField key={node.path} node={node} element={element} bindings={{}} />
                ))}
            </>
        );

        const [title, layout] = screen.getAllByTestId("value").map(v => JSON.parse(v.textContent!));
        expect(title).toBe("Hello");
        expect(layout).toEqual({ value: "3", header: "Hi" });
    });
});
