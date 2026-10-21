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
import { LayoutPreviewPagePresenterRegistration } from "./LayoutPreviewPagePresenter.js";

// Document state updates are committed in a microtask.
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const pages: LayoutPreviewPageOption[] = [
    { id: "about#0001", title: "About", path: "/de/about", language: "de" },
    { id: "home#0002", title: "Home", path: "/de", language: "de" }
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
            properties: { title: id },
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

    it("lists the pages in the layout's language", async () => {
        presenter.init(createEditor("de"));
        await flush();

        expect(listPages.execute).toHaveBeenCalledWith("de");
        expect(presenter.vm.options).toEqual([
            { label: "About (/de/about)", value: "about#0001" },
            { label: "Home (/de)", value: "home#0002" }
        ]);
        expect(presenter.vm.selectedPageId).toBeNull();
    });

    it("lists all pages for a layout without a language", async () => {
        presenter.init(createEditor(null));
        await flush();

        expect(listPages.execute).toHaveBeenCalledWith(null);
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
        expect(previewPageOf(editor)?.id).toBe("about#0001");
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
