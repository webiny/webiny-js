// @vitest-environment happy-dom
import { createApp } from "vue";
import { createSSRApp } from "vue";
import { defineComponent } from "vue";
import { h } from "vue";
import { nextTick } from "vue";
import { shallowRef } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { afterEach } from "vitest";
import { vi } from "vitest";
import { createComponent } from "@webiny/cms-sdk";
import { entryStoreManager } from "@webiny/cms-sdk";
import { refCache } from "@webiny/cms-sdk";
import type { CmsEntry } from "@webiny/cms-sdk";
import type { CmsModelDefinition } from "@webiny/cms-sdk";
import { EntryRenderer } from "./EntryRenderer.js";
import { DynamicZoneField } from "./DynamicZoneField.js";
import { RefField } from "./RefField.js";
import { useEntry } from "./useEntry.js";

const model: CmsModelDefinition = {
    name: "Article",
    modelId: "article",
    fields: [],
    metadata: { componentMap: { quoteTemplate: "Article/Quote" } }
};

const Quote = defineComponent({
    props: { text: { type: String, default: "" } },
    setup: props => () => h("blockquote", props.text)
});

const components = [
    createComponent(Quote, { name: "Article/Quote", label: "Quote", description: "" })
];

const createEntry = (entryId: string): CmsEntry => ({
    id: `${entryId}#0001`,
    entryId,
    values: {
        title: "Hello",
        content: [{ _templateId: "quoteTemplate", text: "First quote" }]
    }
});

const Article = defineComponent({
    setup() {
        const entry = useEntry<{ title: string; content: unknown[] }>();
        return () =>
            h("article", [
                h("h1", entry.value?.values.title),
                h(DynamicZoneField, { value: entry.value?.values.content })
            ]);
    }
});

const renderArticle = (entry: CmsEntry) => {
    return () => h(EntryRenderer, { entry, model, components }, () => h(Article));
};

describe("EntryRenderer", () => {
    afterEach(() => {
        entryStoreManager.removeStore("article-1");
        entryStoreManager.removeStore("article-2");
        entryStoreManager.removeStore("article-3");
        entryStoreManager.removeStore("article-4");
    });

    it("renders the entry and its dynamic zone on the server", async () => {
        const entry = createEntry("article-1");
        const app = createSSRApp({ render: renderArticle(entry) });
        const html = await renderToString(app);

        expect(html).toContain("<h1>Hello</h1>");
        expect(html).toContain("<blockquote>First quote</blockquote>");
    });

    it("re-renders when the editor patches the entry in place", async () => {
        const el = document.createElement("div");
        const entry = createEntry("article-2");
        const app = createApp({ render: renderArticle(entry) });
        app.mount(el);

        const store = entryStoreManager.getStore("article-2");
        store.applyPatch([
            { op: "replace", path: "/values/title", value: "Edited" },
            {
                op: "add",
                path: "/values/content/1",
                value: { _templateId: "quoteTemplate", text: "Second quote" }
            }
        ]);
        await nextTick();

        expect(el.querySelector("h1")?.textContent).toBe("Edited");
        expect([...el.querySelectorAll("blockquote")].map(q => q.textContent)).toEqual([
            "First quote",
            "Second quote"
        ]);

        app.unmount();
    });
    it("follows the store of the new entry when the entry changes", async () => {
        const first = createEntry("article-3");
        const second = createEntry("article-4");
        second.values.title = "Second article";
        const current = shallowRef(first);

        const el = document.createElement("div");
        const app = createApp({
            render: () =>
                h(EntryRenderer, { entry: current.value, model, components }, () => h(Article))
        });
        app.mount(el);

        current.value = second;
        await nextTick();
        expect(el.querySelector("h1")?.textContent).toBe("Second article");

        const secondStore = entryStoreManager.getStore("article-4");
        secondStore.applyPatch([{ op: "replace", path: "/values/title", value: "Edited second" }]);
        await nextTick();

        expect(el.querySelector("h1")?.textContent).toBe("Edited second");
        const firstStore = entryStoreManager.getStore("article-3");
        expect(firstStore.getEntry()?.values.title).toBe("Hello");

        app.unmount();
    });
});

describe("RefField", () => {
    it("renders the loading slot, then the referenced entries", async () => {
        let resolveEntry: (entry: CmsEntry) => void = () => {};
        refCache.setResolver({
            getEntry: () => new Promise(resolve => (resolveEntry = resolve))
        });

        const el = document.createElement("div");
        const app = createApp({
            render: () =>
                h(
                    RefField,
                    { value: { id: "author-1", modelId: "author" } },
                    {
                        default: ({ entries }: { entries: CmsEntry[] }) =>
                            h("span", entries.map(e => e.values.name).join(",")),
                        loading: () => h("em", "Loading")
                    }
                )
        });
        app.mount(el);

        expect(el.innerHTML).toBe("<em>Loading</em>");

        resolveEntry({ id: "author-1#0001", entryId: "author-1", values: { name: "Ana" } });
        await vi.waitFor(() => expect(el.innerHTML).toBe("<span>Ana</span>"));

        app.unmount();
    });

    it("does not resolve references on the server", async () => {
        const getEntry = vi.fn(() => new Promise<CmsEntry>(() => {}));
        refCache.setResolver({ getEntry });

        const render = () =>
            h(
                RefField,
                { value: { id: "author-ssr", modelId: "author" } },
                { default: () => h("span", "Resolved"), loading: () => h("em", "Loading") }
            );
        const app = createSSRApp({ render });
        const html = await renderToString(app);

        expect(html).toContain("<em>Loading</em>");
        expect(getEntry).not.toHaveBeenCalled();
    });
});
