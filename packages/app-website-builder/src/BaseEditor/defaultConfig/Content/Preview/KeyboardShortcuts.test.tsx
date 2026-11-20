import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { Editor } from "~/editorSdk/Editor.js";
import { Commands } from "~/BaseEditor/index.js";
import { KeyboardShortcuts } from "./KeyboardShortcuts.js";

// The editor in context, without `DocumentEditor`'s providers (they load the whole admin).
const current = vi.hoisted(() => ({ editor: undefined as unknown }));
vi.mock("~/DocumentEditor/index.js", () => ({ useDocumentEditor: () => current.editor }));

afterEach(() => {
    cleanup();
});

describe("KeyboardShortcuts", () => {
    it.each(["Backspace", "Delete"])(
        "%s deletes the selected element, marked as coming from the keyboard",
        async key => {
            const editor = new Editor({
                id: "page",
                properties: {},
                elements: {},
                bindings: {}
            } as any);
            editor.updateEditor(state => {
                state.selectedElement = "spacer";
            });
            const deletes: unknown[] = [];
            editor.registerCommandHandler(Commands.DeleteElement, payload => {
                deletes.push(payload);
            });

            current.editor = editor;
            render(<KeyboardShortcuts />);
            fireEvent.keyDown(document.body, {
                key,
                keyCode: key === "Backspace" ? 8 : 46,
                which: key === "Backspace" ? 8 : 46
            });

            // The command bus runs its handlers asynchronously.
            await vi.waitFor(() => expect(deletes).toHaveLength(1));
            expect(deletes).toEqual([{ id: "spacer", source: "keyboard" }]);
        }
    );
});
