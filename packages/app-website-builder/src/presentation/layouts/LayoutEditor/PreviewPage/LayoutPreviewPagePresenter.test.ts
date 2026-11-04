import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { Editor } from "~/editorSdk/Editor.js";
import {
    GetLayoutPreviewPageUseCase,
    type LayoutPreviewPageOption,
    ListLayoutPreviewPagesUseCase
} from "~/features/layouts/index.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { LayoutPreviewPagePresenter, LayoutPreviewPageStorage } from "./abstractions.js";
import {
    LayoutPreviewPagePresenterRegistration,
    SEARCH_DELAY_MS
} from "./LayoutPreviewPagePresenter.js";

// Document state updates are committed in a microtask.
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const pages: LayoutPreviewPageOption[] = [
    { id: "about#0001", title: "About", path: "/de/about" },
    { id: "home#0002", title: "Home", path: "/de" }
];

const createEditor = (language: string | null) => {
    return new Editor<LayoutEditorDocument>({
        id: "site-de#0001",
        entryId: "site-de",
        status: "draft",
        locked: false,
        version: 1,
        state: {},
        properties: { id: "site-de#0001", title: "Site", language, path: "/_webiny/layout" },
        metadata: {},
        extensions: {},
        elements: {},
        bindings: {},
        previewPage: null
    } as LayoutEditorDocument);
};

const previewPageOf = (editor: Editor<LayoutEditorDocument>) => {
    return editor.getDocumentState().read().previewPage ?? null;
};

describe("LayoutPreviewPagePresenter", () => {
    const listPages = { execute: vi.fn() };
    const getPage = { execute: vi.fn() };
    const notifications = { success: vi.fn(), warning: vi.fn(), notify: vi.fn() };
    let stored: Record<string, string>;
    let presenter: LayoutPreviewPagePresenter.Interface;

    beforeEach(() => {
        vi.clearAllMocks();
        stored = {};
        listPages.execute.mockResolvedValue(pages);
        getPage.execute.mockImplementation(async (id: string) => ({
            id,
            properties: { title: `Title of ${id}`, path: `/${id}` },
            elements: { root: { type: "Webiny/Element", id: "root", component: { name: "Root" } } },
            bindings: {}
        }));

        const storage: LayoutPreviewPageStorage.Interface = {
            get: entryId => stored[entryId] ?? null,
            set: (entryId, pageId) => {
                if (pageId) {
                    stored[entryId] = pageId;
                } else {
                    delete stored[entryId];
                }
            }
        };

        const container = new Container();
        container.registerInstance(ListLayoutPreviewPagesUseCase, listPages);
        container.registerInstance(GetLayoutPreviewPageUseCase, getPage);
        container.registerInstance(LayoutPreviewPageStorage, storage);
        container.registerInstance(Notifications, notifications as any);
        container.register(LayoutPreviewPagePresenterRegistration);
        presenter = container.resolve(LayoutPreviewPagePresenter);
    });

    it("lists the most recently saved pages, whatever the layout's language", async () => {
        presenter.init(createEditor("de"));
        await flush();

        expect(listPages.execute).toHaveBeenCalledWith("");
        expect(presenter.vm.options).toEqual([
            { label: "About (/de/about)", value: "about#0001" },
            { label: "Home (/de)", value: "home#0002" }
        ]);
        expect(presenter.vm.selectedPageId).toBeNull();
        expect(presenter.vm.selected).toBeNull();
        expect(presenter.vm.searching).toBe(false);
    });

    it("searches the pages once typing pauses, and lists what the last search found", async () => {
        presenter.init(createEditor("de"));
        await flush();
        listPages.execute.mockClear();
        listPages.execute.mockImplementation(async (search: string) =>
            pages.filter(page => page.title.toLowerCase().includes(search))
        );

        void presenter.search("h");
        expect(presenter.vm.searching).toBe(true);
        await presenter.search("ho");

        expect(listPages.execute).toHaveBeenCalledTimes(1);
        expect(listPages.execute).toHaveBeenCalledWith("ho");
        expect(presenter.vm.options).toEqual([{ label: "Home (/de)", value: "home#0002" }]);
        expect(presenter.vm.searching).toBe(false);
    });

    it("ignores search results that come in after a newer search", async () => {
        presenter.init(createEditor("de"));
        await flush();

        let resolveSlow: (pages: LayoutPreviewPageOption[]) => void = () => {};
        listPages.execute.mockImplementation((search: string) => {
            if (search === "ab") {
                return new Promise(resolve => (resolveSlow = resolve));
            }
            return Promise.resolve([pages[1]]);
        });

        const slow = presenter.search("ab");
        // Let the slow search start.
        await new Promise(resolve => setTimeout(resolve, SEARCH_DELAY_MS + 10));
        await presenter.search("ho");
        resolveSlow([pages[0]]);
        await slow;

        expect(presenter.vm.options).toEqual([{ label: "Home (/de)", value: "home#0002" }]);
    });

    it("keeps the picked page listed and shown when a search doesn't find it", async () => {
        presenter.init(createEditor("de"));
        await flush();

        await presenter.select("about#0001");
        expect(presenter.vm.selected).toEqual({ label: "About (/de/about)", value: "about#0001" });

        listPages.execute.mockResolvedValue([pages[1]]);
        await presenter.search("ho");

        expect(presenter.vm.options).toEqual([
            { label: "About (/de/about)", value: "about#0001" },
            { label: "Home (/de)", value: "home#0002" }
        ]);
        expect(presenter.vm.selected).toEqual({ label: "About (/de/about)", value: "about#0001" });
    });

    it("sets the picked page on the document, and remembers it per layout", async () => {
        const editor = createEditor("de");
        presenter.init(editor);

        await presenter.select("home#0002");
        await flush();

        expect(getPage.execute).toHaveBeenCalledWith("home#0002");
        expect(previewPageOf(editor)?.id).toBe("home#0002");
        expect(previewPageOf(editor)?.elements.root).toBeDefined();
        expect(stored["site-de"]).toBe("home#0002");

        await presenter.select(null);
        await flush();

        expect(previewPageOf(editor)).toBeNull();
        expect(stored["site-de"]).toBeUndefined();
    });

    it("restores the remembered page", async () => {
        stored["site-de"] = "about#0001";
        const editor = createEditor("de");

        presenter.init(editor);
        await flush();
        await flush();

        expect(presenter.vm.selectedPageId).toBe("about#0001");
        // Restored before the pages are listed: labelled by the loaded page.
        expect(presenter.vm.selected).toEqual({
            label: "Title of about#0001 (/about#0001)",
            value: "about#0001"
        });
        expect(previewPageOf(editor)?.id).toBe("about#0001");
    });

    it("labels a remembered page that isn't listed by the loaded page", async () => {
        stored["site-de"] = "old#0003";
        const editor = createEditor("de");

        presenter.init(editor);
        await flush();
        await flush();

        expect(presenter.vm.selected).toEqual({
            label: "Title of old#0003 (/old#0003)",
            value: "old#0003"
        });
        expect(presenter.vm.options[0]).toEqual(presenter.vm.selected);
    });

    it("forgets a remembered page that can't be loaded", async () => {
        stored["site-de"] = "gone#0001";
        getPage.execute.mockRejectedValue(new Error("Not found"));
        const editor = createEditor("de");

        presenter.init(editor);
        await flush();
        await flush();

        expect(presenter.vm.selectedPageId).toBeNull();
        expect(previewPageOf(editor)).toBeNull();
        expect(stored["site-de"]).toBeUndefined();
        expect(notifications.warning).toHaveBeenCalled();
    });

    it("ignores a page load that finishes after another page was picked", async () => {
        let resolveSlow: (page: any) => void = () => {};
        getPage.execute.mockImplementation((id: string) => {
            if (id === "about#0001") {
                return new Promise(resolve => (resolveSlow = resolve));
            }
            return Promise.resolve({ id, properties: {}, elements: {}, bindings: {} });
        });

        const editor = createEditor("de");
        presenter.init(editor);

        const slow = presenter.select("about#0001");
        await presenter.select("home#0002");
        resolveSlow({ id: "about#0001", properties: {}, elements: {}, bindings: {} });
        await slow;
        await flush();

        expect(previewPageOf(editor)?.id).toBe("home#0002");
        expect(presenter.vm.selectedPageId).toBe("home#0002");
    });
});
