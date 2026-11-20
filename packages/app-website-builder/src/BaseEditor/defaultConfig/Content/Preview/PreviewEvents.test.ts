// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { Messenger } from "@webiny/website-builder-sdk";
import { Editor } from "~/editorSdk/Editor.js";
import { PreviewEvents } from "./PreviewEvents.js";

function fakeMessenger() {
    const handlers = new Map<string, (payload: any) => void>();
    const messenger = {
        on: vi.fn((type: string, handler: (payload: any) => void) => {
            handlers.set(type, handler);
            return () => handlers.delete(type);
        }),
        send: vi.fn(),
        dispose: vi.fn()
    };
    return {
        messenger: messenger as unknown as Messenger,
        receive: (type: string, payload: unknown) => handlers.get(type)?.(payload)
    };
}

describe("PreviewEvents: preview.data", () => {
    it("keeps the preview's keyed data in the editor state", () => {
        vi.useFakeTimers();
        const editor = new Editor({ id: "page", elements: {}, bindings: {}, state: {} } as any);
        const events = new PreviewEvents(editor);
        const { messenger, receive } = fakeMessenger();
        events.onConnected(messenger);

        expect(editor.getEditorState().read().previewData).toEqual({});

        receive("preview.data", {
            key: "pac.canvasData.entertainmentCategories",
            value: { 101: { id: "101" } }
        });
        receive("preview.data", { key: "other", value: [1, 2] });
        receive("preview.data", { value: "no key" });

        expect(editor.getEditorState().read().previewData).toEqual({
            "pac.canvasData.entertainmentCategories": { 101: { id: "101" } },
            other: [1, 2]
        });

        receive("preview.data", { key: "other", value: [3] });
        expect(editor.getEditorState().read().previewData["other"]).toEqual([3]);

        events.destroy();
        vi.useRealTimers();
    });
});
