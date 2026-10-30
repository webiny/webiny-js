// @vitest-environment happy-dom
import { createApp, createSSRApp, defineComponent, h, nextTick } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, it, expect, afterEach, vi } from "vitest";
import {
    createComponent,
    entryStoreManager,
    refCache,
    type CmsEntry,
    type CmsModelDefinition
} from "@webiny/cms-sdk";
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
    });

    it("renders the entry and its dynamic zone on the server", async () => {
        const html = await renderToString(
            createSSRApp({ render: renderArticle(createEntry("article-1")) })
        );

        expect(html).toContain("<h1>Hello</h1>");
        expect(html).toContain("<blockquote>First quote</blockquote>");
    });

    it("re-renders when the editor patches the entry in place", async () => {
        const el = document.createElement("div");
        const app = createApp({ render: renderArticle(createEntry("article-2")) });
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
});
