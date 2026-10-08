import { describe, it, expect } from "vitest";
import { jsonPatch } from "@webiny/website-builder-sdk";
import type { DocumentElementBindings } from "@webiny/website-builder-sdk";
import { PreviewedBindings } from "./PreviewedBindings.js";

const bindingsWithTitle = (title: string): DocumentElementBindings => ({
    inputs: { title: { id: "title", type: "text", static: title } }
});

// Stands in for InputsUpdater: the patch that turns `bindings` into the updated bindings.
const updateTo = (target: DocumentElementBindings) => ({
    createJsonPatch: (bindings: DocumentElementBindings) => jsonPatch.compare(bindings, target)
});

/**
 * The preview side: like EditingElementRenderer, it applies every patch on top of its own copy.
 */
class FakePreview {
    public bindings: DocumentElementBindings;

    constructor(committed: DocumentElementBindings) {
        this.bindings = structuredClone(committed);
    }

    apply(patch: any[]) {
        jsonPatch.applyPatch(this.bindings, patch, false, true);
    }
}

describe("PreviewedBindings", () => {
    it("brings the preview back when the value returns to the committed one (undo)", () => {
        const committed = bindingsWithTitle("abc");
        const preview = new FakePreview(committed);
        const previewed = new PreviewedBindings();

        // Type "d".
        preview.apply(previewed.createPatch(updateTo(bindingsWithTitle("abcd")), committed));
        expect(preview.bindings).toEqual(bindingsWithTitle("abcd"));

        // Undo back to the committed "abc". Diffed against the committed bindings this patch was
        // empty, and the preview stayed on "abcd".
        const patch = previewed.createPatch(updateTo(bindingsWithTitle("abc")), committed);
        expect(patch).not.toEqual([]);
        preview.apply(patch);
        expect(preview.bindings).toEqual(bindingsWithTitle("abc"));
    });

    it("follows a run of edits", () => {
        const committed = bindingsWithTitle("");
        const preview = new FakePreview(committed);
        const previewed = new PreviewedBindings();

        for (const value of ["a", "ab", "abc", "ab", "a", ""]) {
            preview.apply(previewed.createPatch(updateTo(bindingsWithTitle(value)), committed));
            expect(preview.bindings).toEqual(bindingsWithTitle(value));
        }
    });

    it("starts over from the committed bindings once they change", () => {
        const previewed = new PreviewedBindings();

        const first = bindingsWithTitle("abc");
        previewed.createPatch(updateTo(bindingsWithTitle("abcd")), first);

        // A commit (here of "xyz") reaches the preview as a document update, not through us.
        const second = bindingsWithTitle("xyz");
        const preview = new FakePreview(second);

        const patch = previewed.createPatch(updateTo(bindingsWithTitle("xyz!")), second);
        preview.apply(patch);
        expect(preview.bindings).toEqual(bindingsWithTitle("xyz!"));
    });
});
