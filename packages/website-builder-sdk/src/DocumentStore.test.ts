import { describe, expect, it } from "vitest";
import { reaction, toJS } from "mobx";
import { DocumentStore } from "./DocumentStore.js";
import type { Document } from "./types.js";

function page(titles: Record<string, string>, extra: Record<string, unknown> = {}): Document {
    return {
        id: "page#0001",
        properties: { title: "Home" },
        metadata: {},
        elements: Object.fromEntries(
            Object.keys(titles).map(id => [
                id,
                { type: "Webiny/Element", id, component: { name: "Text" } }
            ])
        ),
        bindings: Object.fromEntries(
            Object.entries(titles).map(([id, title]) => [
                id,
                { inputs: { title: { id: `${id}-title`, type: "text", static: title } } }
            ])
        ),
        ...extra
    } as unknown as Document;
}

/** How often each element's bindings were seen to change, as an element renderer subscribes. */
function watchBindings(store: DocumentStore, ids: string[]) {
    const runs: Record<string, number> = Object.fromEntries(ids.map(id => [id, 0]));
    const disposers = ids.map(id =>
        reaction(
            () => toJS(store.getDocument()!.bindings[id]),
            () => {
                runs[id]++;
            }
        )
    );
    return { runs, dispose: () => disposers.forEach(dispose => dispose()) };
}

describe("DocumentStore.setDocument", () => {
    it("updates only the bindings that changed when a new document comes in", () => {
        const store = new DocumentStore();
        store.setDocument(page({ a: "Hello", b: "World" }));
        const watched = watchBindings(store, ["a", "b"]);

        store.setDocument(page({ a: "Hallo", b: "World" }));

        expect(watched.runs).toEqual({ a: 1, b: 0 });
        expect(toJS(store.getDocument())).toEqual(page({ a: "Hallo", b: "World" }));
        watched.dispose();
    });

    it("changes nothing when the new document is equal", () => {
        const store = new DocumentStore();
        store.setDocument(page({ a: "Hello", b: "World" }));
        const watched = watchBindings(store, ["a", "b"]);

        store.setDocument(page({ a: "Hello", b: "World" }));

        expect(watched.runs).toEqual({ a: 0, b: 0 });
        watched.dispose();
    });

    it("adds and removes elements and fields as the new document has them", () => {
        const store = new DocumentStore();
        store.setDocument(page({ a: "Hello", b: "World" }, { state: { open: true } }));

        store.setDocument(page({ a: "Hello", c: "New" }));

        expect(toJS(store.getDocument())).toEqual(page({ a: "Hello", c: "New" }));
    });

    it("keeps the store's document object, so subscribers keep reading the same store", () => {
        const store = new DocumentStore();
        store.setDocument(page({ a: "Hello" }));
        const first = store.getDocument();

        store.setDocument(page({ a: "Hallo" }));

        expect(store.getDocument()).toBe(first);
    });
});
