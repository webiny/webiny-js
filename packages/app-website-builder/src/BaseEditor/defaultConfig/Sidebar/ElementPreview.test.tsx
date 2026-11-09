import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CompositionProvider } from "@webiny/react-composition";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { Editor } from "~/editorSdk/Editor.js";
import { ElementPreview } from "./ElementPreview.js";

// The editor in context, without `DocumentEditor`'s providers (they load the whole admin).
const current = vi.hoisted(() => ({ editor: undefined as unknown }));
vi.mock("~/DocumentEditor/index.js", () => ({ useDocumentEditor: () => current.editor }));

const element = {
    id: "spacer",
    type: "Webiny/Element",
    component: { name: "Acme/Spacer" }
} as DocumentElement;

function createEditor() {
    const editor = new Editor({ id: "page", properties: {}, elements: {}, bindings: {} } as any);
    editor.updateEditor(state => {
        state.components = { "Acme/Spacer": { name: "Acme/Spacer", label: "Spacer" } } as any;
    });
    return editor;
}

function renderPreview(decorators: React.ComponentType[] = []) {
    current.editor = createEditor();
    render(
        <CompositionProvider>
            {decorators.map((Decorator, index) => (
                <Decorator key={index} />
            ))}
            <ElementPreview element={element} />
        </CompositionProvider>
    );
}

afterEach(() => {
    cleanup();
});

describe("ElementPreview", () => {
    it("draws the component's label and the actions menu", () => {
        renderPreview();

        expect(screen.getByText("Spacer")).toBeTruthy();
        expect(document.querySelector('[aria-haspopup="menu"]')).toBeTruthy();
    });

    it("is decoratable: an extension can draw its own header", () => {
        const TitleOnly = ElementPreview.createDecorator(() => {
            return function TitleOnly(props) {
                return <h2>{`Title of ${props.element.id}`}</h2>;
            };
        });

        renderPreview([TitleOnly]);

        expect(screen.getByText("Title of spacer")).toBeTruthy();
        expect(screen.queryByText("Spacer")).toBeNull();
        expect(document.querySelector('[aria-haspopup="menu"]')).toBeNull();
    });
});
